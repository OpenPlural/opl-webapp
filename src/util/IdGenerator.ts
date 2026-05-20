const ID_EPOCH = 1777000000000; // 2026-04-24T03:06:40
let lastGenerationTime = 0;
let trackedSequenceNumber = 0;

// This function generates an ID by combining the current timestamp with an additional sequence number.
// The sequence number is incremented if multiple IDs are generated within the same millisecond, ensuring uniqueness.
// This also handles browsers rounding timestamps for security reasons.
// At most 9999 IDs can be generated in the same millisecond, which should be more than enough for typical use cases.
export function generateLocalId() {
  const timestamp = Date.now() - ID_EPOCH;
  let sequence;
  if (timestamp == lastGenerationTime) {
    if (trackedSequenceNumber >= 9999) {
      throw new Error("Too many IDs generated in the same millisecond");
    }
    sequence = ++trackedSequenceNumber;
  } else {
    lastGenerationTime = timestamp;
    trackedSequenceNumber = 0;
    sequence = 0;
  }
  sequence = sequence.toString();
  while (sequence.length < 4) {
    sequence = '0' + sequence;
  }
  return BigInt(timestamp.toString() + sequence);
}
