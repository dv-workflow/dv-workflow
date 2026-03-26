// Minimal fixture that contains the known Vietnamese IME bug pattern.
// This is NOT the real Claude CLI; only used for testing the patcher logic.
//
// IMPORTANT: The comment below must contain both '@anthropic-ai' and 'claude-code'
// to pass the bundle signature guard in patchCliJs(). Do not remove it.
// @anthropic-ai/claude-code bundle stub

function demo(INPUT) {
  if(INPUT.includes("\x7f")){
    let COUNT=(INPUT.match(/\x7f/g)||[]).length,STATE=CURSTATE;
    UPDATETEXT(STATE.text);UPDATEOFFSET(STATE.offset)
    return;
  }
}

