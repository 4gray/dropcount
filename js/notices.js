import { elements } from "./config.js";

export function showNotice(message) {
  elements.noticeText.textContent = message;
  elements.notice.hidden = false;
}

export function hideNotice() {
  elements.notice.hidden = true;
  elements.noticeText.textContent = "";
}
