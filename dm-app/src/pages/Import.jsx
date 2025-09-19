import { useEffect } from "react";

function decodePayload(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); }
  catch { return null; }
}

export default function Import() {
  useEffect(() => {
    // Read hash query:  #/import?data=BASE64
    const hash = window.location.hash || "";
    const query = hash.includes("?") ? hash.split("?")[1] : "";
    const qs = new URLSearchParams(query);
    const data = qs.get("data");

    const payload = data && decodePayload(data);
    if (payload) {
      const prev = JSON.parse(localStorage.getItem("quiz_inbox") || "[]");
      prev.unshift(payload); // newest first
      localStorage.setItem("quiz_inbox", JSON.stringify(prev));
      window.location.hash = "#/inbox";
    } else {
      window.location.hash = "#/inbox";
    }
  }, []);

  return <div className="p-6">Importing…</div>;
}
