# Test Plan & Manual Test Cases (TC-01 to TC-13)

This document contains test cases for validating the **Anonymous Text** university Software Engineering Sessional web application. It covers functional requirements (FR-01 through FR-14), security boundaries, and edge cases.

---

### Summary of Test Cases

| Test Case ID | Test Category | Description | Status |
| :--- | :--- | :--- | :--- |
| **TC-01** | Authentication | Successful User Registration with Valid Data | Passed |
| **TC-02** | Authentication | Registration Rejection on Duplicate Username or Email | Passed |
| **TC-03** | Authentication | Successful User Login with Valid Credentials | Passed |
| **TC-04** | Security / Auth | Failed Login with Invalid Credentials (Generic Error) | Passed |
| **TC-05** | Security / Auth | Login Rejection for Administratively Blocked Accounts | Passed |
| **TC-06** | Messaging | Compose and Send Anonymous Message to Valid Username | Passed |
| **TC-07** | Messaging | Compose Message with Non-Existent Username ("User not found") | Passed |
| **TC-08** | Messaging / UI | Inbox Listing, Unread Indicator, and Cream Paper Note View | Passed |
| **TC-09** | Messaging | Send Anonymous Reply to Received Message | Passed |
| **TC-10** | Messaging | Soft Delete Received Message from Inbox | Passed |
| **TC-11** | Moderation | Report Inappropriate Message with Optional Block Sender | Passed |
| **TC-12** | Admin Panel | Admin Review, Report Dismiss/Delete/Block, and User Unblock | Passed |
| **TC-13** | Word Filter | Offensive Word Filter Rejection ("you are stupid") | Passed |

---

### Detailed Test Case Specifications

#### TC-01: Successful User Registration with Valid Data
- **Objective**: Verify that a new visitor can register with valid details.
- **Preconditions**: The email and username are not already in use.
- **Steps**:
  1. Navigate to `/register`.
  2. Enter Full Name: `Test Student`.
  3. Enter Username: `student_01` (3–50 chars, alphanumeric + underscore).
  4. Enter Email: `student01@university.edu`.
  5. Enter Password: `Password123!` (>= 6 characters).
  6. Click **Create Account**.
- **Expected Result**: User account is created in MongoDB with hashed password. A secure `httpOnly` cookie is set, and the user is redirected to `/dashboard` with a success toast notification.

---

#### TC-02: Registration Rejection on Duplicate Username or Email
- **Objective**: Ensure the system prevents duplicate account creation.
- **Preconditions**: `student_01` and `student01@university.edu` already exist in the database.
- **Steps**:
  1. Navigate to `/register`.
  2. Enter Full Name: `Second Student`.
  3. Enter Username: `student_01` (already exists).
  4. Enter Email: `different@university.edu`.
  5. Enter Password: `Password123!`.
  6. Click **Create Account**.
- **Expected Result**: System rejects the submission with error toast `"Username is already taken"`. Repeat step with existing email to verify `"Email is already registered"`.

---

#### TC-03: Successful User Login with Valid Credentials
- **Objective**: Verify authenticated session creation.
- **Preconditions**: An active user account exists (`student_01` / `Password123!`).
- **Steps**:
  1. Navigate to `/` (login page).
  2. Enter Username or Email: `student_01`.
  3. Enter Password: `Password123!`.
  4. Click **Sign In**.
- **Expected Result**: An `auth_token` JWT cookie (`httpOnly`, `SameSite=Lax`) is issued. The user is redirected to `/dashboard`, and their full name appears in the welcome banner.

---

#### TC-04: Failed Login with Invalid Credentials (Generic Error)
- **Objective**: Verify that login failures return generic error messages to prevent username enumeration.
- **Preconditions**: Any browser session on `/`.
- **Steps**:
  1. Navigate to `/`.
  2. Enter Username: `student_01`.
  3. Enter Password: `WrongPassword999`.
  4. Click **Sign In**.
- **Expected Result**: The server returns HTTP 401 with generic error: `"Invalid username or password"`. No hint is given regarding whether the username exists.

---

#### TC-05: Login Rejection for Administratively Blocked Accounts
- **Objective**: Verify that blocked accounts cannot log in to the application.
- **Preconditions**: User `student_01` has `isBlocked: true` in MongoDB.
- **Steps**:
  1. Navigate to `/`.
  2. Enter Username: `student_01`.
  3. Enter correct Password: `Password123!`.
  4. Click **Sign In**.
- **Expected Result**: Server returns HTTP 403 with error: `"Your account has been blocked. Please contact an administrator."` Access is denied.

---

#### TC-06: Compose and Send Anonymous Message to Valid Username
- **Objective**: Verify sending an anonymous note with live character counting.
- **Preconditions**: User A (`student_01`) and User B (`student_02`) exist. User A is logged in.
- **Steps**:
  1. Navigate to `/compose`.
  2. Enter Send to: `student_02`.
  3. Observe live character counter displaying `0 / 500`.
  4. Type note content: `Congratulations on your outstanding presentation today!`.
  5. Observe counter updates to `56 / 500`.
  6. Click **Send Anonymous Note**.
- **Expected Result**: Success toast: `"Message sent anonymously!"`. Redirects to `/dashboard`. The message is stored with `senderId: student_01`, `receiverId: student_02`.

---

#### TC-07: Compose Message with Non-Existent Username ("User not found")
- **Objective**: Verify error handling when targeting a non-existent recipient.
- **Preconditions**: User A is logged in.
- **Steps**:
  1. Navigate to `/compose`.
  2. Enter Send to: `ghost_user_99999`.
  3. Type message: `Hello there!`.
  4. Click **Send Anonymous Note**.
- **Expected Result**: Server returns HTTP 404 with error toast `"User not found"`. Message is not created.

---

#### TC-08: Inbox Listing, Unread Indicator, and Cream Paper Note View
- **Objective**: Verify that received messages display with an unread badge and open as a Cream Paper Note without leaking sender info.
- **Preconditions**: User B has an unread message sent by User A.
- **Steps**:
  1. Log in as User B (`student_02`).
  2. Open `/dashboard`.
  3. Observe the inbox card showing the envelope icon, unread glowing pink dot, preview snippet, and relative time ago.
  4. Click the card to open `/message/[id]`.
- **Expected Result**:
  - The note renders in a Cream Paper Note style (`#fbf7ef`) with serif typography.
  - Inspecting the Network tab in DevTools confirms the API response for `GET /api/messages/[id]` contains **no `senderId` or sender metadata**.
  - Returning to `/dashboard` confirms the note is now marked as read (glowing pink dot removed).

---

#### TC-09: Send Anonymous Reply to Received Message
- **Objective**: Verify two-way anonymous conversation replies.
- **Preconditions**: User B is viewing a received message on `/message/[id]`.
- **Steps**:
  1. On `/message/[id]`, click **Reply Anonymously**.
  2. Enter reply text: `Thank you so much! That means a lot.`.
  3. Click **Send Reply**.
  4. Log in as User A (`student_01`) and open `/dashboard`.
- **Expected Result**:
  - User A receives the reply in their inbox with a `"Reply"` badge.
  - Opening the reply displays the previous context quote without revealing either party's identity.

---

#### TC-10: Soft Delete Received Message from Inbox
- **Objective**: Verify soft deletion of messages by the recipient.
- **Preconditions**: User B is viewing a received note on `/message/[id]`.
- **Steps**:
  1. On `/message/[id]`, click **Delete**.
  2. Confirm browser prompt.
- **Expected Result**:
  - Toast `"Message deleted"` is shown.
  - User B is redirected to `/dashboard`.
  - The message is removed from User B's inbox.
  - In MongoDB, the document remains with `isDeleted: true`.

---

#### TC-11: Report Inappropriate Message with Optional Block Sender
- **Objective**: Verify reporting an offensive message and blocking the sender without learning who they are.
- **Preconditions**: User B receives an unwanted message.
- **Steps**:
  1. On `/message/[id]`, click **Report**.
  2. Enter Reason: `Unsolicited spam message violates course forum rules`.
  3. Check the box: `Also block this sender from messaging me again`.
  4. Click **Submit Report**.
- **Expected Result**:
  - Toast: `"Report submitted and sender has been blocked."`
  - A `Report` record with status `"pending"` is created in MongoDB.
  - A `Block` record is created for `(blockerId: User B, blockedSenderId: User A)`.
  - If User A attempts to send another message to User B, they receive: `"Message could not be delivered. You have been blocked by this user."`

---

#### TC-12: Admin Moderation Actions (Dismiss, Delete, Block, Unblock)
- **Objective**: Verify that administrators can moderate reported messages and toggle user account blocks.
- **Preconditions**: An admin account exists (`admin@example.com` / `Admin@123456`). A report from TC-11 is pending.
- **Steps**:
  1. Log in as `admin`.
  2. Navigate to `/admin/reports`.
  3. Observe the reported note showing message text, reporter reason, and **the sender's username** (`@student_01`).
  4. Click **Block Sender Account**.
  5. Navigate to `/admin/users`.
  6. Verify `student_01` displays status `Blocked`.
  7. Click the **Unblock** toggle button.
- **Expected Result**:
  - The report status transitions to `"resolved"`.
  - Clicking Unblock toggles the user's status back to `Active`.
  - Success toasts confirm each operation.

---

#### TC-13: Offensive Word Filter Rejection ("you are stupid")
- **Objective**: Verify that the offensive word filter catches explicit insults, leetspeak variations, and collapses repeated letters.
- **Preconditions**: User A is logged in and on `/compose`.
- **Steps**:
  1. Navigate to `/compose`.
  2. Enter recipient: `student_02`.
  3. Enter message content: `you are stupid`.
  4. Click **Send Anonymous Note**.
  5. Test variations: `y0u are stuuupid`, `you are STUPID!`, and `you are s.t.u.p.i.d`.
- **Expected Result**:
  - Every variation is immediately rejected with HTTP 400.
  - Exact error message displayed:
    > **"Your message has offensive words. Please rewrite it politely."**
  - No message is saved to the database.

