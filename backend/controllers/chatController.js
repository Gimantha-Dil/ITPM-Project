const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

exports.startChat = async (req, res) => {
  try {
    const { sellerId, noteId, sessionId } = req.body;
    if (!sellerId) return res.status(400).json({ message: 'Seller ID is required' });
    if (String(sellerId) === String(req.userId)) return res.status(400).json({ message: 'You cannot chat with yourself' });
    let chat = await Chat.findOne({ participants: { $all: [req.userId, sellerId] } });
    if (!chat) {
      chat = new Chat({ participants: [req.userId, sellerId], messages: [] });
      if (noteId) chat.relatedNote = noteId;
      if (sessionId) chat.relatedSession = sessionId;
      await chat.save();
    }
    await chat.populate('participants', 'fullName email');
    if (chat.relatedNote) { try { await chat.populate('relatedNote', 'title'); } catch(e) {} }
    if (chat.relatedSession) { try { await chat.populate('relatedSession', 'title'); } catch(e) {} }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to start chat', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.participants.includes(req.userId)) return res.status(403).json({ message: 'Not a participant' });
    const message = { sender: req.userId, content, createdAt: new Date() };
    chat.messages.push(message);
    chat.lastMessage = { content, sender: req.userId, createdAt: new Date() };
    await chat.save();
    const recipientId = chat.participants.find(p => p.toString() !== req.userId.toString());
    await Notification.create({
      recipient: recipientId, type: 'new_message', title: 'New Message',
      message: `${req.user.fullName}: ${content.substring(0, 50)}...`,
      link: `/chat/${chat._id}`
    });
    res.json({ message: 'Message sent', data: message });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.userId, isActive: true })
      .populate('participants', 'fullName email')
      .populate('relatedNote', 'title')
      .populate('relatedSession', 'title')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chats', error: error.message });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('messages.sender', 'fullName email')
      .populate('participants', 'fullName email');
    if (!chat || !chat.participants.some(p => p._id.toString() === req.userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }
    chat.messages.forEach(msg => {
      if (msg.sender._id.toString() !== req.userId.toString()) msg.read = true;
    });
    await chat.save();
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

function match(msg, keywords) {
  return keywords.some(kw => msg.includes(kw));
}

// Replies object - en and si for every topic
const REPLIES = {
  greeting: {
    en: `Hello! Welcome to SLIIT Learning Platform!

I can help you with:
- Notes: upload, buy, download, bookmark
- Payments: bank details, payment slips, verification
- Kuppi Sessions: create, enroll, MS Teams
- Chat: message sellers/buyers
- Analytics: earnings, downloads, ratings
- Account: profile, bank details, password

Ask me anything!`,
    si: `ආයුබෝවන්! SLIIT Learning Platform එකට සාදරයෙන් පිළිගනිමු!

මට උදව් කරන්න පුළුවන්:
- Notes: upload, buy, download, bookmark
- Payments: bank details, slips, verification
- Kuppi Sessions: create, enroll
- Chat: sellers/buyers සමඟ
- Analytics: ආදායම, downloads, ratings
- Account: profile, bank details, password

ඕනෑ දෙයක් අහන්න!`
  },

  upload_notes: {
    en: `How to Upload and Sell Notes:

1. Add bank details in Profile first
2. Sidebar - SELLER - Create Note
3. Fill the form:
   - Title, Description
   - Category: IT/SE/CS/DS/Business/Engineering/Other
   - Subject, Price (0 = Free, or LKR amount)
   - Tags
4. Upload file (Max 10MB)
5. Click "Upload Note"

Your note will appear in the marketplace!
Tip: Good title and description gets more sales!`,
    si: `Notes Upload කරන හැටි:

1. Profile - Bank Details add කරන්න
2. Sidebar - SELLER - Create Note
3. Form fill කරන්න:
   - Title, Description
   - Category: IT/SE/CS/DS/Business/Engineering/Other
   - Subject, Price (0 = Free, හෝ LKR amount)
   - Tags
4. File upload කරන්න (Max 10MB)
5. "Upload Note" click

Marketplace එකේ note දිස්වෙනවා!
ඉඟිය: හොඳ title + description = විකුණුම් වැඩිවේ!`
  },

  price: {
    en: `Setting Price for Notes:

- FREE note: enter 0 in the price field
- PAID note: enter LKR amount (e.g. 100, 250, 500)

Tips:
- Check what similar notes cost
- Free notes get more views but no income
- Quality notes can be priced higher
- Exam season notes are very popular!`,
    si: `Notes ලට මිල දාන හැටි:

- FREE note: price field ලෙ 0 දාන්න
- PAID note: LKR amount දාන්න (e.g. 100, 250, 500)

ඉඟි:
- Similar notes ගේ price check කරන්න
- Free notes - views වැඩිය, ආදායම නෑ
- Quality notes ලට higher price දාන්න
- Exam notes ගොඩක් popular!`
  },

  file_types: {
    en: `Allowed File Types for Upload:

Documents: PDF, Word (doc/docx), PowerPoint (ppt/pptx), Excel (xls/xlsx), Text (txt)
Images: JPEG, PNG, GIF

Max file size: 10MB

Tip: PDF is the most popular format!`,
    si: `Upload කරන්න පුළුවන් File Types:

Documents: PDF, Word (doc/docx), PowerPoint (ppt/pptx), Excel (xls/xlsx), Text (txt)
Images: JPEG, PNG, GIF

Max file size: 10MB

ඉඟිය: PDF format ගොඩක් popular!`
  },

  download: {
    en: `How to Download Notes:

FREE Notes:
- Go to note page, click "Download"
- Anyone can download for free

PAID Notes:
1. Check seller bank details on note page
2. Do a bank transfer
3. Upload payment slip
4. Wait for seller to verify
5. After verified, go to My Purchases and download

All purchased notes are in My Purchases page!`,
    si: `Notes Download කරන හැටි:

FREE Notes:
- Note page ලෙ "Download" click
- ඕනෑ කෙනෙකුට download කරන්න පුළුවන්

PAID Notes:
1. Note page ලෙ seller bank details බලන්න
2. Bank transfer කරන්න
3. Payment slip upload කරන්න
4. Seller verify කරනකම් wait
5. Verify - My Purchases - Download

Purchase කළ notes My Purchases page ලෙ!`
  },

  bookmark: {
    en: `How to Bookmark Notes:

Add Bookmark:
- Go to note page, click "Bookmark" button

View Bookmarks:
- Sidebar - My Items - Bookmarks

Remove Bookmark:
- Go to Bookmarks page, click "Remove Bookmark"

Tip: Bookmark notes to find them quickly later!`,
    si: `Notes Bookmark කරන හැටි:

Bookmark Add:
- Note page ලෙ "Bookmark" button click

Bookmarks බලන්න:
- Sidebar - My Items - Bookmarks

Remove:
- Bookmarks page ලෙ "Remove Bookmark" click

ඉඟිය: ඕනෑ notes bookmark කරලා later buy!`
  },

  payment_work: {
    en: `How Payment Works:

1. View seller bank details on note/session page
2. Do a bank transfer to seller's account
3. Upload your payment slip on the platform
4. Seller receives a notification
5. Seller checks and verifies the slip
6. You receive email + PDF receipt automatically
7. You get download / join access instantly!

Direct bank transfer - no middleman involved!`,
    si: `Payment System ක්‍රමය:

1. Note/Session page ලෙ seller bank details බලන්න
2. Seller ගේ account ලට bank transfer කරන්න
3. Platform ලෙ payment slip upload කරන්න
4. Seller ට notification යනවා
5. Seller slip check කරලා verify කරනවා
6. Email + PDF receipt automatically ලැබෙනවා
7. Download / Join access ලැබෙනවා!

Direct bank transfer - middle man නෑ!`
  },

  payment_slip: {
    en: `How to Upload Payment Slip:

1. Go to note or session page
2. Check seller's bank details
3. Do a bank transfer
4. Take a screenshot of the receipt
5. In "Upload Payment Slip" section, select file
6. Click "Submit Purchase"

Allowed formats: JPG, PNG, GIF, WEBP, PDF (Max 5MB)

Tip: Clear and readable slip = faster verification!`,
    si: `Payment Slip Upload කරන හැටි:

1. Note හෝ Session page ලෙ යන්න
2. Seller bank details බලන්න
3. Bank transfer කරන්න
4. Receipt screenshot ගන්න
5. "Upload Payment Slip" section ලෙ file select
6. "Submit Purchase" click

Formats: JPG, PNG, GIF, WEBP, PDF (Max 5MB)

ඉඟිය: Clear slip = ඉක්මනින් verify!`
  },

  verify_time: {
    en: `Verification Time:

Paid items:
- Seller manually verifies the payment
- Usually takes a few hours to 1 day
- Depends on seller's availability

Free Sessions (Type A):
- Auto-verified instantly! No slip needed
- Click Enroll = verified immediately!

Status meanings:
- Pending = waiting for seller to verify
- Verified = access is ready!

Tip: If taking too long, message the seller!`,
    si: `Verification කාලය:

Paid items:
- Seller manually verify කරනවා
- සාමාන්‍යයෙන් hours කිහිපයක් - දිනකට
- Seller ගේ availability ලෙ depend

Free Sessions (Type A):
- Auto-verify instantly! Slip ඕනෑ නෑ
- Enroll click = verified!

Status:
- Pending = seller verify කරලා නෑ
- Verified = access ready!

ඉඟිය: ප‍්‍රමාදයක් නම් seller ට message!`
  },

  verify_payment: {
    en: `How to Verify Payments (For Sellers/Hosts):

For Sellers - Note purchases:
1. Sidebar - My Notes - View Purchases
2. Check payment slip ("View Slip")
3. Click "Verify" button
- Buyer gets email + PDF receipt automatically

For Hosts - Session enrollments:
1. Sidebar - My Sessions - View Enrollments
2. Check student's slip
3. Click "Verify"
- Student gets MS Teams link unlocked

Use "Verify All" button to bulk verify!`,
    si: `Payment Verify කරන හැටි (Sellers/Hosts ලට):

Sellers - Note purchases:
1. Sidebar - My Notes - View Purchases
2. Payment slip check ("View Slip")
3. "Verify" button click
- Buyer ට email + PDF receipt යනවා

Hosts - Session enrollments:
1. Sidebar - My Sessions - View Enrollments
2. Student ගේ slip check
3. "Verify" click
- Student ට MS Teams link unlock

"Verify All" button ලෙ bulk verify!`
  },

  banks: {
    en: `Supported Banks (30+):

Main Banks: Bank of Ceylon, People's Bank, Commercial Bank, HNB, Sampath Bank, Seylan Bank, NTB

Other Banks: DFCC, NDB, PABC, Union Bank, Amana Bank, NSB, Cargills Bank

International: HSBC, Standard Chartered, Citibank, State Bank of India

30+ banks available in the dropdown!`,
    si: `Support කරන Banks (30+):

ප‍්‍රධාන Banks: BOC, People's Bank, Commercial Bank, HNB, Sampath Bank, Seylan Bank, NTB

අනෙකුත්: DFCC, NDB, PABC, Union Bank, Amana Bank, NSB, Cargills Bank

International: HSBC, Standard Chartered, Citibank, State Bank of India

Dropdown ලෙ 30+ banks!`
  },

  bank_details: {
    en: `How to Add Bank Details:

1. Go to Profile page - Bank Details section
2. Click "Add Bank Details"
3. Fill in:
   - Bank Name (from dropdown, 30+ banks)
   - Account Number
   - Branch name
   - Account Holder Name
4. Click "Save Bank Details"

After adding bank details:
- SELLER section unlocks in Sidebar
- You can sell notes and host sessions
- Buyers can see your details for payment

No need for bank details at registration - add later!`,
    si: `Bank Details Add කරන හැටි:

1. Profile page - Bank Details section
2. "Add Bank Details" click
3. Fill:
   - Bank Name (dropdown, 30+ banks)
   - Account Number
   - Branch name
   - Account Holder Name
4. "Save Bank Details" click

Bank details add කළාට පස්සේ:
- Sidebar ලෙ SELLER section unlock
- Notes sell + Sessions host කරන්න පුළුවන්
- Buyers ට ඔයාගේ details පේනවා

Registration ලෙ ඕනෑ නෑ - later add!`
  },

  create_session: {
    en: `How to Create a Kuppi Session:

1. Add bank details first (Profile)
2. Sidebar - SELLER - Create Session
3. Fill the form:
   - Title, Description, Category, Subject
   - Session Type:
     Type A = Free
     Type B = Paid Individual
     Type C = Paid Group
     Type D = Premium
   - Price (Type A = 0)
   - MS Teams Link
   - Date, Time, Max Participants
4. Click "Create Session"

Tip: Always add MS Teams link for students to join!`,
    si: `Kuppi Session හදන හැටි:

1. Bank details add (Profile)
2. Sidebar - SELLER - Create Session
3. Form fill:
   - Title, Description, Category, Subject
   - Session Type:
     Type A = Free
     Type B = Paid Individual
     Type C = Paid Group
     Type D = Premium
   - Price (Type A = 0)
   - MS Teams Link
   - Date, Time, Max Participants
4. "Create Session" click

ඉඟිය: MS Teams link add කරන්නම!`
  },

  enroll: {
    en: `How to Enroll in a Kuppi Session:

FREE Sessions (Type A):
1. Go to session page
2. Click "Enroll (Free)"
3. Auto verified! MS Teams link shows immediately

PAID Sessions (Type B/C/D):
1. Check host bank details on session page
2. Do bank transfer
3. Upload payment slip
4. Click "Submit Enrollment"
5. Wait for host to verify
6. After verified, MS Teams link unlocks!

Check enrollment status on session page:
- Pending = waiting for host
- Verified = ready to join!`,
    si: `Kuppi Session Enroll වෙන හැටි:

FREE Sessions (Type A):
1. Session page ලෙ යන්න
2. "Enroll (Free)" click
3. Auto verified! MS Teams link දිස්වෙනවා

PAID Sessions (Type B/C/D):
1. Session page ලෙ host bank details
2. Bank transfer
3. Payment slip upload
4. "Submit Enrollment" click
5. Host verify කරනකම් wait
6. Verify - MS Teams link unlock!

Status:
- Pending = host verify කරලා නෑ
- Verified = join ready!`
  },

  ms_teams: {
    en: `About MS Teams Link:

For Hosts (Session creators):
- Paste the Teams link in "MS Teams Link" field when creating session
- How to get link: MS Teams - New Meeting - Copy link

For Students:
- Free sessions: Link appears after enrolling
- Paid sessions: Link unlocks after payment verified
- Click "Open MS Teams Link" button on session page

Important: Only verified students can see the link!
Pending students cannot see it.`,
    si: `MS Teams Link ගැන:

Hosts ලට:
- Create Session ලෙ "MS Teams Link" field ලෙ paste
- Link ගන්නේ: MS Teams - New Meeting - Copy link

Students ලට:
- Free sessions: Enroll ලෙ link show
- Paid sessions: Verify ලෙ link unlock
- "Open MS Teams Link" button click

වැදගත්: Verified students ලට මාත්‍රයයි link පෙනෙන්නේ!
Pending students ලට hide.`
  },

  verify_students: {
    en: `How to Verify Student Payments (For Hosts):

1. Sidebar - SELLER - My Sessions
2. Expand session - "View Enrollments"
3. Check student's payment slip ("View Slip")
4. Click "Verify" button

After verifying:
- Student gets email + PDF receipt
- Student's MS Teams link unlocks
- Student gets a notification

Use "Verify All" button for bulk verification!`,
    si: `Student Payments Verify කරන හැටි (Hosts ලට):

1. Sidebar - SELLER - My Sessions
2. Session expand - "View Enrollments"
3. Student ගේ slip check ("View Slip")
4. "Verify" click

Verify ලෙ පස්සේ:
- Student ට email + PDF receipt
- MS Teams link unlock
- Notification යනවා

"Verify All" ලෙ bulk verify!`
  },

  excel: {
    en: `How to Generate Excel Report:

1. Sidebar - SELLER - Analytics
2. Click "Export Excel Report" button
3. An .xlsx file will download

Report contains:
- Notes Sales sheet: purchases, revenue per note
- Session Sales sheet: enrollments, revenue
- Summary sheet: total stats, ratings, downloads

Great for tracking your overall earnings!`,
    si: `Excel Report හදන හැටි:

1. Sidebar - SELLER - Analytics
2. "Export Excel Report" click
3. .xlsx file download

Report ලෙ:
- Notes Sales: purchases, revenue
- Session Sales: enrollments, revenue
- Summary: total stats, ratings, downloads

ඔයාගේ ආදායම track කරන්න!`
  },

  chat_seller: {
    en: `How to Chat with a Seller:

1. Go to note page
2. Click "Ask Seller" button
3. Chat window opens
4. Type and send your message

Or go to: Sidebar - Tools - Messages
All your conversations are listed there.

The chat is linked to the note, so the seller sees context!`,
    si: `Seller කෙනෙකුට Message කරන හැටි:

1. Note page ලෙ යන්න
2. "Ask Seller" button click
3. Chat window open
4. Message type කරලා send

හෝ: Sidebar - Tools - Messages
ඔයාගේ conversations ලිස්ට් ලෙ.

Chat ලෙ note linked - seller ට context පෙනෙනවා!`
  },

  send_message: {
    en: `How to Send Messages:

1. Sidebar - Tools - Messages
2. Select a conversation from the list
3. Type your message in the text box
4. Click the Send button

The other person gets a notification!

To start a new chat:
- Go to a note page and click "Ask Seller"`,
    si: `Messages Send කරන හැටි:

1. Sidebar - Tools - Messages
2. List ලෙ conversation select
3. Text box ලෙ message type
4. Send button click

Other person ලට notification!

නව chat start:
- Note page ලෙ "Ask Seller" click`
  },

  unread: {
    en: `How to Check Unread Messages:

1. Click the message icon in the top navbar
2. Or go to: Sidebar - Tools - Messages

Notifications:
- New message alert appears in navbar
- Bell icon shows unread count
- Click bell to go to notifications page

Messages page shows the last message preview for each chat!`,
    si: `Unread Messages Check කරන හැටි:

1. Navbar ලෙ message icon click
2. හෝ: Sidebar - Tools - Messages

Notifications:
- New message ලෙ navbar ලෙ alert
- Bell icon ලෙ count show
- Bell click - notifications page

Messages page ලෙ last message preview!`
  },

  earnings: {
    en: `How to View Your Earnings:

1. Sidebar - SELLER - Analytics
2. You will see:
   - Total Revenue (notes + sessions)
   - Notes Revenue
   - Sessions Revenue
   - Pending Payments

Dashboard (Home page) shows quick stats:
- Total revenue, notes listed, sessions created

Click "Export Excel Report" for detailed breakdown!`,
    si: `Earnings Check කරන හැටි:

1. Sidebar - SELLER - Analytics
2. පේනවා:
   - Total Revenue (notes + sessions)
   - Notes Revenue
   - Sessions Revenue
   - Pending Payments

Dashboard ලෙ quick stats:
- Total revenue, notes, sessions

"Export Excel Report" ලෙ detail breakdown!`
  },

  stats: {
    en: `How to Check Download Statistics:

Sidebar - SELLER - Analytics shows:
- Total Views: how many times notes were viewed
- Total Downloads: download count
- Total Note Sales: verified purchases
- Session Enrollments

Dashboard also shows an overview!

More views = improve your title and description!`,
    si: `Download Statistics Check කරන හැටි:

Sidebar - SELLER - Analytics ලෙ:
- Total Views: notes view count
- Total Downloads: downloads
- Total Note Sales: verified purchases
- Session Enrollments

Dashboard ලෙ overview!

Views වැඩි කරන්න - title + description improve!`
  },

  ratings: {
    en: `Ratings and Feedback:

Leave Feedback:
- After buying or downloading a free note
- After joining a verified session
- Go to item page - Feedback section - Rate 1-5 stars + comment

View Your Ratings:
- Analytics page - Average Rating card
- Each note/session page has its own feedback section

Sellers get a notification when new feedback arrives!
Good ratings = more buyers trust you!`,
    si: `Ratings සහ Feedback:

Feedback දෙන හැටි:
- Note buy/free download ලෙ
- Session verified ලෙ
- Item page - Feedback section - Rate 1-5 + comment

ඔයාගේ Ratings:
- Analytics page - Average Rating
- Each note/session page ලෙ feedback

New feedback ලෙ seller ට notification!
හොඳ ratings = buyers ගොඩක් trust!`
  },

  profile: {
    en: `How to Update Profile:

1. Click your name (top right) - Profile
   Or: Navbar dropdown - Profile

2. Personal Information section:
   - Full Name: can be changed
   - Email: cannot change (SLIIT email fixed)
   - Phone Number: can be updated

3. Click "Update Profile"

Add bank details in Profile to unlock seller features!`,
    si: `Profile Update කරන හැටි:

1. Top right ලෙ name click - Profile
   හෝ: Navbar dropdown - Profile

2. Personal Information:
   - Full Name: change කරන්න පුළුවන්
   - Email: change නෑ (SLIIT email fixed)
   - Phone Number: update කරන්න පුළුවන්

3. "Update Profile" click

Bank details add = seller features unlock!`
  },

  password: {
    en: `How to Change Password:

1. Go to Profile page
2. Scroll to "Change Password" section
3. Fill in:
   - Current Password
   - New Password (minimum 6 characters)
   - Confirm New Password
4. Click "Change Password"

Use a strong password with letters, numbers and symbols!`,
    si: `Password Change කරන හැටි:

1. Profile page ලෙ යන්න
2. "Change Password" section ලෙ
3. Fill:
   - Current Password
   - New Password (min 6 characters)
   - Confirm New Password
4. "Change Password" click

Strong password use කරන්න - letters + numbers + symbols!`
  },

  register: {
    en: `How to Register:

1. Go to Login page, click "Register" link
2. Fill in:
   - Full Name
   - SLIIT Email (must end with @my.sliit.lk)
   - Phone Number
   - Password (minimum 6 characters)
   - Confirm Password
3. Click "Register"
4. Verify OTP sent to your email

ONLY @my.sliit.lk emails are allowed!
Bank details are not needed at registration - add later!
Registration is completely free!`,
    si: `Register වෙන හැටි:

1. Login page - "Register" link click
2. Fill:
   - Full Name
   - SLIIT Email (@my.sliit.lk only)
   - Phone Number
   - Password (min 6 characters)
   - Confirm Password
3. "Register" click
4. Email ලෙ OTP verify

@my.sliit.lk emails ONLY!
Bank details ලෙ ඕනෑ නෑ - later add!
Registration නොමිලේ!`
  },

  help: {
    en: `AI Helper - I can help with:

Notes: Upload notes, Set price, File types, Download, Bookmark
Payments: How payment works, Upload slip, Verification, Banks, Add bank details
Kuppi Sessions: Create session, Enroll, MS Teams link, Verify students, Excel report
Chat: Message seller, Send message, Check unread
Analytics: View earnings, Download stats, Ratings
Account: Update profile, Change password, Register

Ask anything in English or Sinhala!`,
    si: `AI Helper - මට උදව් කරන්න පුළුවන්:

Notes: Upload, Price set, File types, Download, Bookmark
Payments: Payment ක්‍රමය, Slip upload, Verification, Banks, Bank details
Kuppi Sessions: Session create, Enroll, MS Teams, Student verify, Excel report
Chat: Seller ලට message, Message send, Unread check
Analytics: Earnings, Download stats, Ratings
Account: Profile update, Password change, Register

ඕනෑ දෙයක් English හෝ Sinhala ලෙ!`
  },

  thanks: {
    en: `You are welcome! Happy to help anytime!`,
    si: `ස්තුතියි! ඕනෑ වෙලාවක අහන්න!`
  },

  default: {
    en: `I am not sure about that. Try asking:

Notes: "How to upload notes?" / "How to download?"
Payment: "How does payment work?" / "What banks are supported?"
Sessions: "How to create kuppi session?" / "How to enroll?"
Chat: "How to chat with a seller?"
Account: "How to add bank details?" / "Change password?"

Type "help" for full list!`,
    si: `ඒ ගැන confirm නෑ. මේ ගැන අහලා බලන්න:

Notes: "Notes upload කරන්නේ කොහොමද?"
Payment: "Payment කරන්නේ කොහොමද?"
Sessions: "Kuppi session හදන්නේ කොහොමද?"
Chat: "Seller ට message කරන්නේ කොහොමද?"
Account: "Bank details add කරන්නේ කොහොමද?"

"උදව්" type = full list!`
  }
};

exports.chatbot = async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message || !message.trim()) {
      return res.json({ reply: 'Please type a message!' });
    }
    const lang = language || 'en';
    const msg = message.toLowerCase().trim();

    let topic = 'default';

    if (match(msg, ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'good night', 'ayubowan', 'ආයුබෝවන්', 'හෙලෝ', 'කොහොමද', 'හායි'])) topic = 'greeting';
    else if (match(msg, ['upload note', 'sell note', 'create note', 'notes upload', 'notes දාන', 'note upload', 'notes sell', 'notes upload කරන්නේ', 'upload කරන්නේ', 'notes sell කරන්නේ']) && !match(msg, ['payment slip', 'slip'])) topic = 'upload_notes';
    else if (match(msg, ['set price', 'price set', 'මිල', 'pricing', 'how much charge', 'free note', 'price set කරන්නේ', 'price දාන්නේ'])) topic = 'price';
    else if (match(msg, ['file type', 'what file', 'file format', 'allowed file', 'file types', 'කොන් file'])) topic = 'file_types';
    else if (match(msg, ['download note', 'how to download', 'download කරන', 'බාගන්න', 'note download', 'download කරන්නේ'])) topic = 'download';
    else if (match(msg, ['bookmark', 'save note', 'bookmark කරන', 'bookmarks', 'note bookmark', 'bookmark කරන්නේ'])) topic = 'bookmark';
    else if (match(msg, ['how payment work', 'payment work', 'payment system', 'how does payment', 'ගෙවීම', 'payment කරන්නේ කොහොමද', 'payment ක්‍රමය', 'payment system ගැන'])) topic = 'payment_work';
    else if (match(msg, ['payment slip', 'slip upload', 'upload slip', 'slip', 'ස්ලිප්', 'slip දාන', 'slip upload කරන්නේ'])) topic = 'payment_slip';
    else if (match(msg, ['how long', 'verification take', 'pending', 'auto verif', 'verify වෙන්න කොච්චර'])) topic = 'verify_time';
    else if (match(msg, ['how to verify', 'verify payment', 'verify කරන', 'payment verify', 'confirm payment', 'payment verify කරන්නේ'])) topic = 'verify_payment';
    else if (match(msg, ['bank support', 'which bank', 'what bank', 'බැංකු', 'supported bank', 'banks support', 'banks'])) topic = 'banks';
    else if (match(msg, ['bank detail', 'bank add', 'add bank', 'bank setup', 'bank details add', 'bank details දාන්නේ', 'bank details add කරන්නේ'])) topic = 'bank_details';
    else if (match(msg, ['create session', 'create kuppi', 'host session', 'kuppi create', 'how to create', 'create a kuppi', 'session හදන්නේ', 'kuppi හදන්නේ', 'session create'])) topic = 'create_session';
    else if (match(msg, ['enroll', 'join session', 'session join', 'enroll කරන', 'session enroll', 'enroll වෙන්නේ', 'join වෙන්නේ'])) topic = 'enroll';
    else if (match(msg, ['teams link', 'ms teams', 'meeting link', 'ms teams link', 'ms teams link ගන්නේ'])) topic = 'ms_teams';
    else if (match(msg, ['verify student', 'student payment', 'verify enrollment', 'student verify', 'student payments verify', 'student payments verify කරන්නේ'])) topic = 'verify_students';
    else if (match(msg, ['excel', 'report', 'export', 'generate report', 'excel report', 'excel report හදන්නේ'])) topic = 'excel';
    else if (match(msg, ['chat seller', 'message seller', 'contact seller', 'ask seller', 'chat with', 'how to chat', 'seller message', 'seller ට message', 'chat with a seller'])) topic = 'chat_seller';
    else if (match(msg, ['send message', 'message send', 'send a message', 'how to send', 'how to message', 'message send කරන්නේ', 'message කරන්නේ'])) topic = 'send_message';
    else if (match(msg, ['unread', 'new message', 'check messages', 'unread messages', 'unread messages check'])) topic = 'unread';
    else if (match(msg, ['earning', 'revenue', 'income', 'ආදායම', 'earnings', 'how much earned', 'earnings check', 'earnings බලන්නේ'])) topic = 'earnings';
    else if (match(msg, ['download stat', 'views', 'statistics', 'stats', 'download count', 'download statistics', 'download statistics check'])) topic = 'stats';
    else if (match(msg, ['rating', 'review', 'feedback', 'star', 'rate', 'ratings', 'ratings බලන්නේ', 'review දෙන්නේ'])) topic = 'ratings';
    else if (match(msg, ['update profile', 'edit profile', 'change name', 'profile update', 'profile', 'update my profile', 'profile update කරන්නේ', 'profile change'])) topic = 'profile';
    else if (match(msg, ['change password', 'password change', 'password update', 'new password', 'reset password', 'password', 'මුරපදය', 'password change කරන්නේ'])) topic = 'password';
    else if (match(msg, ['register', 'sign up', 'create account', 'new account', 'ලියාපදිංචි', 'account හදන', 'how to register', 'register වෙන්නේ'])) topic = 'register';
    else if (match(msg, ['help', 'support', 'what can you do', 'උදව්', 'guide', 'tutorial'])) topic = 'help';
    else if (match(msg, ['thanks', 'thank you', 'ස්තුති', 'thank', 'nice', 'great', 'ok', 'okay', 'good'])) topic = 'thanks';

    const reply = REPLIES[topic][lang] || REPLIES[topic]['en'];
    res.json({ reply });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      message: 'Chatbot error',
      reply: 'Sorry, something went wrong. Please try again!',
      error: error.message
    });
  }
};