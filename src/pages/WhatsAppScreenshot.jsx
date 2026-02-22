/* eslint-disable no-empty */
import { useState, useRef } from "react";
import "./WhatsAppScreenshot.css";
import { Helmet } from "react-helmet";
import {
  Plus,
  Trash2,
  Download,
  Camera,
  ChevronDown,
  ArrowLeft,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  MoreVertical,
  Check,
  CheckCheck,
  Wifi,
  Battery,
  Signal,
} from "lucide-react";

/* ── Helpers ── */
function timeStr(h, m) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const DEFAULT_MESSAGES = [
  { id: genId(), sender: "them", text: "hey are you coming tonight?", time: "19:42", status: "read" },
  { id: genId(), sender: "me",   text: "yeah for sure! what time does it start?", time: "19:43", status: "read" },
  { id: genId(), sender: "them", text: "around 9 i think, maybe bring snacks 😂", time: "19:44", status: "read" },
  { id: genId(), sender: "me",   text: "lol okay I'll grab some chips and drinks 🙌", time: "19:45", status: "read" },
  { id: genId(), sender: "them", text: "perfect, see you there!", time: "19:46", status: "read" },
];

const STATUS_COLORS = {
  online:    "#4fc3f7",
  typing:    "#4fc3f7",
  offline:   null,
  lastseen:  null,
};

export default function WhatsAppScreenshot() {
  /* ── Contact info ── */
  const [contactName,   setContactName]   = useState("Sarah ✨");
  const [contactStatus, setContactStatus] = useState("online");
  const [customStatus,  setCustomStatus]  = useState("");
  const [avatarColor,   setAvatarColor]   = useState("#25d366");
  const [avatarEmoji,   setAvatarEmoji]   = useState("👩");

  /* ── Status bar ── */
  const [statusTime,    setStatusTime]    = useState("9:41");
  const [phoneModel,    setPhoneModel]    = useState("iphone"); // iphone | android

  /* ── Chat ── */
  const [messages,      setMessages]      = useState(DEFAULT_MESSAGES);
  const [myName,        setMyName]        = useState("You");
  const [theirName,     setTheirName]     = useState("Sarah");
  const [chatDate,      setChatDate]      = useState("Today");
  const [wallpaper,     setWallpaper]     = useState("default"); // default | dark | minimal | warm

  /* ── New message form ── */
  const [newText,       setNewText]       = useState("");
  const [newSender,     setNewSender]     = useState("me");
  const [newHour,       setNewHour]       = useState(19);
  const [newMin,        setNewMin]        = useState(47);
  const [newStatus,     setNewStatus]     = useState("read");

  /* ── UI state ── */
  const [downloading,   setDownloading]   = useState(false);
  const [activeTab,     setActiveTab]     = useState("messages"); // messages | settings
  const chatRef = useRef(null);

  /* ── Add message ── */
  function addMessage() {
    if (!newText.trim()) return;
    setMessages(prev => [
      ...prev,
      {
        id:     genId(),
        sender: newSender,
        text:   newText.trim(),
        time:   timeStr(newHour, newMin),
        status: newStatus,
      },
    ]);
    setNewText("");
    // Auto-increment time by 1 min
    if (newMin < 59) setNewMin(m => m + 1);
    else { setNewMin(0); setNewHour(h => (h + 1) % 24); }
  }

  function removeMessage(id) {
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  function updateMessage(id, field, value) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  }

  /* ── Download ── */
  async function handleDownload() {
    if (!chatRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chatRef.current, {
        useCORS: true,
        scale: 3,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `whatsapp-${contactName.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // fallback: try dom-to-image via CDN not available, just alert
      alert("Download requires html2canvas. Run: npm install html2canvas");
    } finally {
      setDownloading(false);
    }
  }

  /* ── Status label ── */
  function getStatusLabel() {
    if (contactStatus === "online")   return "online";
    if (contactStatus === "typing")   return "typing...";
    if (contactStatus === "lastseen") return customStatus || "last seen today at 9:41";
    if (contactStatus === "offline")  return "";
    return customStatus;
  }

  /* ── Wallpaper style ── */
  const wallpaperStyles = {
    default: { background: "#e5ddd5" },
    dark:    { background: "#0d1117" },
    minimal: { background: "#f5f0e8" },
    warm:    { background: "#f7e8d0" },
  };

  /* ── Tick icon ── */
  function Tick({ status, dark }) {
    const col = dark ? "rgba(255,255,255,0.6)" : "#8696a0";
    const blue = "#53bdeb";
    if (status === "sent")      return <Check size={14} strokeWidth={2.5} style={{ color: col }} />;
    if (status === "delivered") return <CheckCheck size={14} strokeWidth={2.5} style={{ color: col }} />;
    if (status === "read")      return <CheckCheck size={14} strokeWidth={2.5} style={{ color: blue }} />;
    return null;
  }

  const isDarkWall = wallpaper === "dark";

  return (
    <>
      <Helmet>
        <title>WhatsApp Chat Screenshot Generator – Fake WhatsApp Chat Maker | ShauryaTools</title>
        <meta name="description" content="Create realistic WhatsApp chat screenshots. Set contact name, status, time, and messages between two people. Download as PNG instantly. Free tool." />
        <meta name="keywords" content="whatsapp screenshot generator, fake whatsapp chat, whatsapp chat maker, whatsapp mock, chat screenshot" />
        <link rel="canonical" href="https://shauryatools.vercel.app/whatsapp-screenshot" />
      </Helmet>

      <div className="ws-page">
        <div className="ws-layout">

          {/* ══════════════════ LEFT PANEL ══════════════════ */}
          <div className="ws-panel">

            {/* Header */}
            <div className="ws-panel-header">
              <div className="ws-panel-icon"><Camera size={18} strokeWidth={2} /></div>
              <div>
                <span className="ws-panel-cat">Screenshot Tools</span>
                <h1 className="ws-panel-title">WhatsApp Chat Generator</h1>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="ws-tabs">
              <button className={`ws-tab ${activeTab === "messages" ? "ws-tab-on" : ""}`} onClick={() => setActiveTab("messages")}>
                💬 Messages
              </button>
              <button className={`ws-tab ${activeTab === "settings" ? "ws-tab-on" : ""}`} onClick={() => setActiveTab("settings")}>
                ⚙️ Settings
              </button>
            </div>

            {/* ── MESSAGES TAB ── */}
            {activeTab === "messages" && (
              <div className="ws-section">

                {/* Message list */}
                <div className="ws-msg-list">
                  {messages.map((msg, idx) => (
                    <div key={msg.id} className={`ws-msg-item ${msg.sender === "me" ? "ws-msg-me" : "ws-msg-them"}`}>
                      <div className="ws-msg-meta">
                        <span className={`ws-sender-tag ${msg.sender === "me" ? "ws-tag-me" : "ws-tag-them"}`}>
                          {msg.sender === "me" ? myName : theirName}
                        </span>
                        <div className="ws-msg-controls">
                          <input
                            type="time"
                            className="ws-time-input"
                            value={msg.time}
                            onChange={e => updateMessage(msg.id, "time", e.target.value)}
                          />
                          <select
                            className="ws-status-select"
                            value={msg.status}
                            onChange={e => updateMessage(msg.id, "status", e.target.value)}
                          >
                            <option value="sent">Sent</option>
                            <option value="delivered">Delivered</option>
                            <option value="read">Read</option>
                          </select>
                          <button className="ws-del-btn" onClick={() => removeMessage(msg.id)} title="Delete">
                            <Trash2 size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        className="ws-msg-textarea"
                        value={msg.text}
                        rows={2}
                        onChange={e => updateMessage(msg.id, "text", e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {/* Add message */}
                <div className="ws-add-msg">
                  <p className="ws-add-label">Add Message</p>
                  <div className="ws-sender-row">
                    <button
                      className={`ws-sender-btn ${newSender === "me" ? "ws-snd-on" : ""}`}
                      onClick={() => setNewSender("me")}
                    >
                      {myName}
                    </button>
                    <button
                      className={`ws-sender-btn ${newSender === "them" ? "ws-snd-on" : ""}`}
                      onClick={() => setNewSender("them")}
                    >
                      {theirName}
                    </button>
                  </div>
                  <textarea
                    className="ws-add-textarea"
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) addMessage(); }}
                    placeholder="Type a message... (Ctrl+Enter to add)"
                    rows={3}
                  />
                  <div className="ws-add-footer">
                    <div className="ws-time-row">
                      <select className="ws-mini-select" value={newHour} onChange={e => setNewHour(Number(e.target.value))}>
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                        ))}
                      </select>
                      <span className="ws-colon">:</span>
                      <select className="ws-mini-select" value={newMin} onChange={e => setNewMin(Number(e.target.value))}>
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                        ))}
                      </select>
                      <select className="ws-mini-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                        <option value="sent">Sent ✓</option>
                        <option value="delivered">Delivered ✓✓</option>
                        <option value="read">Read 🔵✓✓</option>
                      </select>
                    </div>
                    <button className="ws-add-btn" onClick={addMessage} disabled={!newText.trim()}>
                      <Plus size={14} strokeWidth={2.5} /> Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === "settings" && (
              <div className="ws-section">

                <div className="ws-setting-group">
                  <label className="ws-setting-label">Contact Name</label>
                  <input className="ws-setting-input" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contact name" />
                </div>

                <div className="ws-setting-row">
                  <div className="ws-setting-group">
                    <label className="ws-setting-label">Your Name</label>
                    <input className="ws-setting-input" value={myName} onChange={e => setMyName(e.target.value)} />
                  </div>
                  <div className="ws-setting-group">
                    <label className="ws-setting-label">Their Name</label>
                    <input className="ws-setting-input" value={theirName} onChange={e => setTheirName(e.target.value)} />
                  </div>
                </div>

                <div className="ws-setting-row">
                  <div className="ws-setting-group">
                    <label className="ws-setting-label">Avatar Emoji</label>
                    <input className="ws-setting-input" value={avatarEmoji} onChange={e => setAvatarEmoji(e.target.value)} maxLength={2} />
                  </div>
                  <div className="ws-setting-group">
                    <label className="ws-setting-label">Avatar Color</label>
                    <div className="ws-color-row">
                      <input type="color" className="ws-color-input" value={avatarColor} onChange={e => setAvatarColor(e.target.value)} />
                      <span className="ws-color-val">{avatarColor}</span>
                    </div>
                  </div>
                </div>

                <div className="ws-setting-group">
                  <label className="ws-setting-label">Status</label>
                  <div className="ws-status-pills">
                    {["online", "typing", "lastseen", "offline"].map(s => (
                      <button
                        key={s}
                        className={`ws-status-pill ${contactStatus === s ? "ws-pill-on" : ""}`}
                        onClick={() => setContactStatus(s)}
                      >
                        {s === "lastseen" ? "Last seen" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                  {(contactStatus === "lastseen" || contactStatus === "custom") && (
                    <input
                      className="ws-setting-input"
                      value={customStatus}
                      onChange={e => setCustomStatus(e.target.value)}
                      placeholder="e.g. last seen today at 9:41"
                    />
                  )}
                </div>

                <div className="ws-setting-group">
                  <label className="ws-setting-label">Status Bar Time</label>
                  <input className="ws-setting-input" value={statusTime} onChange={e => setStatusTime(e.target.value)} placeholder="9:41" maxLength={5} />
                </div>

                <div className="ws-setting-group">
                  <label className="ws-setting-label">Chat Date Label</label>
                  <input className="ws-setting-input" value={chatDate} onChange={e => setChatDate(e.target.value)} placeholder="Today" />
                </div>

                <div className="ws-setting-group">
                  <label className="ws-setting-label">Phone Style</label>
                  <div className="ws-status-pills">
                    <button className={`ws-status-pill ${phoneModel === "iphone"  ? "ws-pill-on" : ""}`} onClick={() => setPhoneModel("iphone")}>iPhone</button>
                    <button className={`ws-status-pill ${phoneModel === "android" ? "ws-pill-on" : ""}`} onClick={() => setPhoneModel("android")}>Android</button>
                  </div>
                </div>

                <div className="ws-setting-group">
                  <label className="ws-setting-label">Wallpaper</label>
                  <div className="ws-wallpapers">
                    {[
                      { id: "default", label: "Classic", color: "#e5ddd5" },
                      { id: "dark",    label: "Dark",    color: "#0d1117" },
                      { id: "minimal", label: "Minimal", color: "#f5f0e8" },
                      { id: "warm",    label: "Warm",    color: "#f7e8d0" },
                    ].map(w => (
                      <button
                        key={w.id}
                        className={`ws-wall-btn ${wallpaper === w.id ? "ws-wall-on" : ""}`}
                        onClick={() => setWallpaper(w.id)}
                        style={{ "--wall-color": w.color }}
                      >
                        <span className="ws-wall-swatch" />
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Download */}
            <button className="ws-download-btn" onClick={handleDownload} disabled={downloading}>
              {downloading
                ? <><span className="ws-spinner" /> Capturing...</>
                : <><Download size={16} strokeWidth={2} /> Download Screenshot</>}
            </button>
          </div>

          {/* ══════════════════ RIGHT: PHONE PREVIEW ══════════════════ */}
          <div className="ws-preview-wrap">
            <p className="ws-preview-label">Live Preview</p>

            <div className={`ws-phone ws-phone-${phoneModel}`}>
              {/* Notch / Dynamic Island */}
              {phoneModel === "iphone" && <div className="ws-notch" />}
              {phoneModel === "android" && <div className="ws-camera-dot" />}

              {/* Screen */}
              <div className="ws-screen" ref={chatRef}>

                {/* ── Status Bar ── */}
                <div className={`ws-statusbar ws-statusbar-${phoneModel}`}>
                  <span className="ws-sb-time">{statusTime}</span>
                  <div className="ws-sb-right">
                    {phoneModel === "iphone" ? (
                      <>
                        <Signal size={13} strokeWidth={2} />
                        <Wifi size={13} strokeWidth={2} />
                        <Battery size={13} strokeWidth={2} />
                      </>
                    ) : (
                      <>
                        <Wifi size={12} strokeWidth={2} />
                        <Battery size={12} strokeWidth={2} />
                        <span className="ws-sb-pct">84</span>
                      </>
                    )}
                  </div>
                </div>

                {/* ── WhatsApp Nav Bar ── */}
                <div className="ws-navbar">
                  <ArrowLeft size={22} strokeWidth={2} className="ws-nav-back" />
                  <div
                    className="ws-avatar"
                    style={{ background: avatarColor }}
                  >
                    <span className="ws-avatar-emoji">{avatarEmoji}</span>
                  </div>
                  <div className="ws-nav-info">
                    <span className="ws-nav-name">{contactName}</span>
                    {getStatusLabel() && (
                      <span
                        className="ws-nav-status"
                        style={{
                          color: STATUS_COLORS[contactStatus] || "#8696a0",
                        }}
                      >
                        {getStatusLabel()}
                      </span>
                    )}
                  </div>
                  <div className="ws-nav-icons">
                    <Video size={21} strokeWidth={2} />
                    <Phone size={19} strokeWidth={2} />
                    <MoreVertical size={21} strokeWidth={2} />
                  </div>
                </div>

                {/* ── Chat Area ── */}
                <div className="ws-chat" style={wallpaperStyles[wallpaper]}>
                  {/* Wallpaper pattern overlay */}
                  <div className={`ws-wall-pattern ws-wall-pattern-${wallpaper}`} />

                  {/* Date separator */}
                  <div className="ws-date-sep">
                    <span className="ws-date-label">{chatDate}</span>
                  </div>

                  {/* Messages */}
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`ws-bubble-row ${msg.sender === "me" ? "ws-row-me" : "ws-row-them"}`}
                    >
                      <div
                        className={`ws-chat-bubble ${
                          msg.sender === "me"
                            ? isDarkWall ? "ws-bubble-me-dark" : "ws-bubble-me"
                            : isDarkWall ? "ws-bubble-them-dark" : "ws-bubble-them"
                        }`}
                      >
                        <p className="ws-bubble-msg">{msg.text}</p>
                        <div className="ws-bubble-time-row">
                          <span className={`ws-bubble-time ${isDarkWall ? "ws-time-dark" : ""}`}>{msg.time}</span>
                          {msg.sender === "me" && <Tick status={msg.status} dark={isDarkWall} />}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {contactStatus === "typing" && (
                    <div className="ws-bubble-row ws-row-them">
                      <div className={`ws-chat-bubble ${isDarkWall ? "ws-bubble-them-dark" : "ws-bubble-them"}`}>
                        <div className="ws-typing">
                          <span /><span /><span />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Input Bar ── */}
                <div className={`ws-input-bar ${isDarkWall ? "ws-input-dark" : ""}`}>
                  <Smile size={24} strokeWidth={1.8} className="ws-input-icon" />
                  <div className={`ws-input-field ${isDarkWall ? "ws-input-field-dark" : ""}`}>
                    <span className="ws-input-placeholder">Message</span>
                    <Paperclip size={20} strokeWidth={1.8} className="ws-attach-icon" />
                  </div>
                  <div className={`ws-mic-btn ${isDarkWall ? "ws-mic-dark" : ""}`}>
                    <Mic size={22} strokeWidth={1.8} />
                  </div>
                </div>

              </div>{/* end screen */}
            </div>{/* end phone */}
          </div>

        </div>
      </div>
    </>
  );
}