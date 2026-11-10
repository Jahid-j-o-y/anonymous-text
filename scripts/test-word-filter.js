import { containsOffensiveWords, normalizeText } from "../lib/badWords.js";

const testCases = [
  { text: "you are stupid", expected: true, desc: "TC-13: exact bad word 'stupid'" },
  { text: "y0u are stuuupid", expected: true, desc: "Leetspeak 0->o and collapsed repeated letters" },
  { text: "YOU ARE STUPID!", expected: true, desc: "Uppercase with punctuation" },
  { text: "s.t.u.p.i.d", expected: true, desc: "Stripped symbols check" },
  { text: "You are an idiot", expected: true, desc: "English insult 'idiot'" },
  { text: "tumi ekta kutta", expected: true, desc: "Romanized Bangla bad word 'kutta'" },
  { text: "Hello friend, have a great day!", expected: false, desc: "Clean polite message" },
  { text: "I study at University of Engineering and Technology", expected: false, desc: "Legitimate student message" },
  { text: "The diet was really effective", expected: false, desc: "Word containing substring of short word ('die' in 'diet')" },
];

let failed = 0;
console.log("=== Testing Word Filter & Leetspeak Normalization ===");

for (const tc of testCases) {
  const result = containsOffensiveWords(tc.text);
  const passed = result === tc.expected;
  if (passed) {
    console.log(`✅ PASS: ${tc.desc} -> ${result}`);
  } else {
    console.error(`❌ FAIL: ${tc.desc} -> expected ${tc.expected}, got ${result}`);
    failed++;
  }
}

if (failed === 0) {
  console.log("\n🎉 ALL WORD FILTER TESTS PASSED!");
  process.exit(0);
} else {
  console.error(`\n❌ ${failed} tests failed.`);
  process.exit(1);
}

