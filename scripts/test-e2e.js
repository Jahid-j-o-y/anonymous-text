const BASE_URL = "http://localhost:3001";

async function runEndToEndTests() {
  console.log("=== STARTING FULL END-TO-END VERIFICATION ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  // Helper for requests with cookies
  let cookiesMap = {};
  function extractCookies(res) {
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/auth_token=([^;]+)/);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  // 1. Check Homepage
  try {
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();
    assert(homeRes.status === 200, "TC-00: Homepage renders successfully (200 OK)");
    assert(homeHtml.includes("Anonymous") && homeHtml.includes("Text"), "Homepage contains 'Anonymous Text' brand");
    assert(homeHtml.includes("Say it honestly. Stay anonymous."), "Homepage contains brand tagline");
  } catch (e) {
    assert(false, "TC-00: Homepage reachable", e.message);
  }

  // 2. TC-01: User Registration (User A: student_01)
  let userAToken = null;
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Student One",
        username: "student_01",
        email: "student01@test.com",
        password: "Password123!",
      }),
    });
    const regData = await regRes.json();
    userAToken = extractCookies(regRes);
    assert(regRes.status === 201 || (regRes.status === 400 && regData.error.includes("already")), "TC-01: User A registration", JSON.stringify(regData));
  } catch (e) {
    assert(false, "TC-01: Registration error", e.message);
  }

  // 3. TC-02: User Registration duplicate check
  try {
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Duplicate User",
        username: "student_01",
        email: "different@test.com",
        password: "Password123!",
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400 && dupData.error.includes("already taken"), "TC-02: Duplicate username rejected", JSON.stringify(dupData));
  } catch (e) {
    assert(false, "TC-02: Duplicate registration error", e.message);
  }

  // Register User B: student_02
  let userBToken = null;
  try {
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Student Two",
        username: "student_02",
        email: "student02@test.com",
        password: "Password123!",
      }),
    });
    userBToken = extractCookies(regBRes);
  } catch {}

  // 4. TC-03: User Login (valid credentials)
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "student_01",
        password: "Password123!",
      }),
    });
    const loginData = await loginRes.json();
    userAToken = extractCookies(loginRes) || userAToken;
    assert(loginRes.status === 200 && loginData.success, "TC-03: User A login with valid credentials");
  } catch (e) {
    assert(false, "TC-03: Login error", e.message);
  }

  // Login User B to ensure fresh token
  try {
    const loginBRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "student_02",
        password: "Password123!",
      }),
    });
    userBToken = extractCookies(loginBRes) || userBToken;
  } catch {}

  // 5. TC-04: User Login (invalid credentials) -> Generic error
  try {
    const failRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "student_01",
        password: "WrongPassword999",
      }),
    });
    const failData = await failRes.json();
    assert(failRes.status === 401 && failData.error === "Invalid username or password", "TC-04: Failed login gives generic error", JSON.stringify(failData));
  } catch (e) {
    assert(false, "TC-04: Login fail test", e.message);
  }

  // 6. TC-13: Offensive Word Filter ("you are stupid")
  try {
    const badRes = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${userAToken}`,
      },
      body: JSON.stringify({
        recipientUsername: "student_02",
        content: "you are stupid",
      }),
    });
    const badData = await badRes.json();
    assert(
      badRes.status === 400 &&
      badData.error === "Your message has offensive words. Please rewrite it politely.",
      "TC-13: Offensive word filter rejects 'you are stupid'",
      JSON.stringify(badData)
    );
  } catch (e) {
    assert(false, "TC-13: Word filter test error", e.message);
  }

  // 7. TC-07: Send message to non-existent user
  try {
    const ghostRes = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${userAToken}`,
      },
      body: JSON.stringify({
        recipientUsername: "ghost_user_99999",
        content: "Hello ghost!",
      }),
    });
    const ghostData = await ghostRes.json();
    assert(ghostRes.status === 404 && ghostData.error === "User not found", "TC-07: Message to non-existent user returns 404 'User not found'");
  } catch (e) {
    assert(false, "TC-07: Non-existent recipient test", e.message);
  }

  // 8. TC-06: Send valid anonymous message from User A to User B
  let createdMessageId = null;
  try {
    const sendRes = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${userAToken}`,
      },
      body: JSON.stringify({
        recipientUsername: "student_02",
        content: "Great job on your software engineering presentation today!",
      }),
    });
    const sendData = await sendRes.json();
    assert(sendRes.status === 201 && sendData.success, "TC-06: Send anonymous message succeeds", JSON.stringify(sendData));
  } catch (e) {
    assert(false, "TC-06: Send message error", e.message);
  }

  // 9. TC-08: View Inbox as User B and verify NO SENDER LEAKAGE!
  try {
    const inboxRes = await fetch(`${BASE_URL}/api/messages`, {
      headers: { Cookie: `auth_token=${userBToken}` },
    });
    const inboxData = await inboxRes.json();
    assert(inboxRes.status === 200, "TC-08: User B inbox retrieved");
    assert(inboxData.messages.length > 0, "Inbox contains received message");

    const targetMsg = inboxData.messages[0];
    createdMessageId = targetMsg.id;

    // Architectural security invariant check: MUST NEVER LEAK senderId
    assert(targetMsg.senderId === undefined, "SECURITY INVARIANT: senderId is NOT present in inbox DTO");
    assert(targetMsg.sender === undefined, "SECURITY INVARIANT: sender object is NOT present in inbox DTO");
    assert(targetMsg.content.includes("Great job"), "Message content matches");

    // Open message
    const msgViewRes = await fetch(`${BASE_URL}/api/messages/${createdMessageId}`, {
      headers: { Cookie: `auth_token=${userBToken}` },
    });
    const msgViewData = await msgViewRes.json();
    assert(msgViewRes.status === 200, "Open single message (200 OK)");
    assert(msgViewData.message.senderId === undefined, "SECURITY INVARIANT: senderId is NOT present in message view DTO");
    assert(msgViewData.message.isRead === true, "Opening message marks isRead: true");
  } catch (e) {
    assert(false, "TC-08: Inbox & Message view error", e.message);
  }

  // 10. TC-09: Send anonymous reply from User B back to User A
  let replyMessageId = null;
  try {
    const replyRes = await fetch(`${BASE_URL}/api/messages/${createdMessageId}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${userBToken}`,
      },
      body: JSON.stringify({
        content: "Thank you so much! Truly appreciate the kind feedback.",
      }),
    });
    const replyData = await replyRes.json();
    assert(replyRes.status === 201 && replyData.success, "TC-09: Anonymous reply sent successfully", JSON.stringify(replyData));

    // Verify User A receives reply in inbox
    const aInboxRes = await fetch(`${BASE_URL}/api/messages`, {
      headers: { Cookie: `auth_token=${userAToken}` },
    });
    const aInboxData = await aInboxRes.json();
    const replyMsg = aInboxData.messages.find(m => m.parentId === createdMessageId);
    assert(Boolean(replyMsg), "User A received reply referencing parentId");
    assert(replyMsg.senderId === undefined, "SECURITY INVARIANT: reply does NOT leak replier senderId");
  } catch (e) {
    assert(false, "TC-09: Anonymous reply error", e.message);
  }

  // 11. TC-11: Report Message and optionally Block Sender
  try {
    const reportRes = await fetch(`${BASE_URL}/api/messages/${createdMessageId}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${userBToken}`,
      },
      body: JSON.stringify({
        reason: "Testing report flow for moderation queue",
        alsoBlockSender: false,
      }),
    });
    const reportData = await reportRes.json();
    assert(reportRes.status === 200 && reportData.success, "TC-11: Report submitted successfully");
  } catch (e) {
    assert(false, "TC-11: Report message error", e.message);
  }

  // 12. TC-12: Admin Moderation & Users Directory
  let adminToken = null;
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "admin",
        password: "Admin@123456",
      }),
    });
    const adminData = await adminLoginRes.json();
    adminToken = extractCookies(adminLoginRes);
    assert(adminLoginRes.status === 200 && adminData.user.role === "admin", "Admin logged in successfully");

    // Fetch reports as Admin (sender username SHOULD be visible here for moderation)
    const adminReportsRes = await fetch(`${BASE_URL}/api/admin/reports`, {
      headers: { Cookie: `auth_token=${adminToken}` },
    });
    const adminReportsData = await adminReportsRes.json();
    assert(adminReportsRes.status === 200, "Admin reports queue accessible");
    assert(adminReportsData.reports.length > 0, "Pending report appears in admin queue");

    const pendingReport = adminReportsData.reports[0];
    assert(pendingReport.senderUsername === "student_01", "Sender username (@student_01) visible ONLY in admin moderation queue");

    // Admin dismisses report
    const dismissRes = await fetch(`${BASE_URL}/api/admin/reports/${pendingReport.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `auth_token=${adminToken}`,
      },
      body: JSON.stringify({ action: "dismiss" }),
    });
    const dismissData = await dismissRes.json();
    assert(dismissRes.status === 200 && dismissData.status === "dismissed", "TC-12: Admin successfully dismissed report");

    // Fetch Admin Users list
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: `auth_token=${adminToken}` },
    });
    const usersData = await usersRes.json();
    assert(usersRes.status === 200 && usersData.users.length >= 3, "TC-12: Admin users list contains all registered users");

    // Admin blocks user A
    const targetUser = usersData.users.find(u => u.username === "student_01");
    const toggleBlockRes = await fetch(`${BASE_URL}/api/admin/users/${targetUser.id}/toggle-block`, {
      method: "PATCH",
      headers: { Cookie: `auth_token=${adminToken}` },
    });
    const toggleBlockData = await toggleBlockRes.json();
    assert(toggleBlockRes.status === 200 && toggleBlockData.isBlocked === true, "Admin successfully toggled block on user");

    // TC-05: Blocked user cannot log in
    const blockedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "student_01",
        password: "Password123!",
      }),
    });
    assert(blockedLoginRes.status === 403, "TC-05: Blocked user login rejected with 403 Forbidden");

    // Admin unblocks user A
    const unblockRes = await fetch(`${BASE_URL}/api/admin/users/${targetUser.id}/toggle-block`, {
      method: "PATCH",
      headers: { Cookie: `auth_token=${adminToken}` },
    });
    const unblockData = await unblockRes.json();
    assert(unblockRes.status === 200 && unblockData.isBlocked === false, "Admin successfully unblocked user");
  } catch (e) {
    assert(false, "TC-12: Admin flow error", e.message);
  }

  // 13. TC-10: Soft Delete Message
  try {
    const delRes = await fetch(`${BASE_URL}/api/messages/${createdMessageId}`, {
      method: "DELETE",
      headers: { Cookie: `auth_token=${userBToken}` },
    });
    const delData = await delRes.json();
    assert(delRes.status === 200 && delData.success, "TC-10: Soft delete message succeeds");

    // Verify deleted message no longer in inbox
    const bInboxAfterRes = await fetch(`${BASE_URL}/api/messages`, {
      headers: { Cookie: `auth_token=${userBToken}` },
    });
    const bInboxAfterData = await bInboxAfterRes.json();
    const isPresent = bInboxAfterData.messages.some(m => m.id === createdMessageId);
    assert(!isPresent, "Soft-deleted message is no longer in inbox");
  } catch (e) {
    assert(false, "TC-10: Delete message test error", e.message);
  }

  console.log("\n=============================================");
  console.log(`TOTAL PASSED: ${passed}`);
  console.log(`TOTAL FAILED: ${failed}`);
  console.log("=============================================");

  if (failed === 0) {
    console.log("🎉 ALL AUTOMATED END-TO-END TESTS PASSED ON LIVE ATLAS!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runEndToEndTests();

