const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

// Start or get chat
exports.startChat = async (req, res) => {
  try {
    const { sellerId, noteId, sessionId } = req.body;
    
    console.log('Chat started between', req.userId, 'and', sellerId);

    if (!sellerId) {
      return res.status(400).json({ message: 'Seller ID is required' });
    }

    if (String(sellerId) === String(req.userId)) {
      return res.status(400).json({ message: 'You cannot chat with yourself' });
    }

    // Simple query - just find chat between these two users
    let chat = await Chat.findOne({
      participants: { $all: [req.userId, sellerId] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [req.userId, sellerId],
        messages: []
      });
      if (noteId) chat.relatedNote = noteId;
      if (sessionId) chat.relatedSession = sessionId;
      await chat.save();
      console.log('New chat created:', chat._id);
    }

    // Populate after find/create
    await chat.populate('participants', 'fullName email');
    if (chat.relatedNote) {
      try { await chat.populate('relatedNote', 'title'); } catch(e) {}
    }
    if (chat.relatedSession) {
      try { await chat.populate('relatedSession', 'title'); } catch(e) {}
    }

    console.log('=== CHAT SUCCESS ===');
    res.json(chat);
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ message: 'Failed to start chat', error: error.message });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Not a participant' });
    }

    const message = {
      sender: req.userId,
      content,
      createdAt: new Date()
    };

    chat.messages.push(message);
    chat.lastMessage = {
      content,
      sender: req.userId,
      createdAt: new Date()
    };

    await chat.save();

    const recipientId = chat.participants.find(
      p => p.toString() !== req.userId.toString()
    );

    await Notification.create({
      recipient: recipientId,
      type: 'new_message',
      title: 'New Message',
      message: `${req.user.fullName}: ${content.substring(0, 50)}...`,
      link: `/chat/${chat._id}`
    });

    res.json({ message: 'Message sent', data: message });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Get my chats
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

// Get chat messages
exports.getChatMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('messages.sender', 'fullName email')
      .populate('participants', 'fullName email');

    if (!chat || !chat.participants.some(p => p._id.toString() === req.userId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    chat.messages.forEach(msg => {
      if (msg.sender._id.toString() !== req.userId.toString()) {
        msg.read = true;
      }
    });
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};


// Helper function - check if message matches any keyword
function match(msg, keywords) {
  return keywords.some(kw => msg.includes(kw));
}

exports.chatbot = async (req, res) => {
  try {
    const { message, language } = req.body;
    const lang = language || 'en';
    const msg = message.toLowerCase();

    let reply = '';

    // ---- GREETINGS ----
    if (match(msg, ['hello', 'hi', 'hey', 'howdy', 'good morning', 'good evening', 'ayubowan', 'හෙලෝ', 'ආයුබෝවන්', 'කොහොමද', 'kohomada'])) {
      reply = `Hello!  Welcome to SLIIT Learning Platform!
ආයුබෝවන්!  SLIIT Learning Platform එකට සාදරයෙන් පිළිගනිමු!

I can help you with:
 Notes - upload, buy, download, bookmark
 Payments - bank details, payment slips, verification
 Kuppi Sessions - create, enroll, MS Teams
 Chat - message sellers/buyers
 Analytics - earnings, downloads, ratings
 Account - profile, bank details, password

ඕනෑම දෙයක් English හෝ Sinhala වලින් අහන්න! `;
    }

    //  NOTES

    // Upload notes
    else if (match(msg, ['upload note', 'how to upload notes', 'how do i upload notes', 'sell note', 'create note', 'notes upload', 'notes දාන්නේ', 'notes දාන', 'note upload කරන්නේ', 'අප්ලෝේ්', 'notes sell', 'ළිකුණන', 'notes upload කරන්නේ', 'notes upload කරන්නේ කොහොමද']) && !match(msg, ['payment slip', 'slip', 'ස්ලිප්ි'])) {
      reply = ` How to Upload/Sell Notes:
Notes upload කරන්නේ මෙහෙමයි:

1 First, add bank details in Profile → Bank Details
   පළමුව Profile එකේ Bank Details add කරන්න

2 Go to Sidebar → SELLER → Create Note
   Sidebar එකේ SELLER section → Create Note click කරන්න

3 Form එක පිරවන්න:
   • Title - Note එකේ නම
   • Description - විස්තරයක් දෙන්න
   • Category - IT / SE / CS / DS / Business / Engineering / Other
   • Subject - විෂය
   • Price - මිල (Free නම් 0 දාන්න)
   • Tags - සොයන්න keywords

4 File එක upload කරන්න (Max 10MB)

5 "Upload Note" click කරන්න
   දැන් marketplace එකේ පේනවා!

ඉඟිය: හොඳ title + description = විකුණුම් වැඩිවේ!`;
    }

    // Set price
    else if (match(msg, ['set price', 'price set', 'මිල', 'price කරන', 'pricing', 'how much charge', 'charge', 'free note', 'price set කරන්නේ', 'notes ට price', 'price set කරන්නේ කොහොමද'])) {
      reply = ` Setting Price for Notes:
Notes වලට මිල දාන්නේ මෙහෙමයි:

• Create Note form එකේ "Price (LKR)" field එකේ මිල දාන්න
• FREE note එකක් නම් → 0 දාන්න
• Paid note එකක් නම් → ඕනෑම amount එකක් (e.g., 100, 250, 500)

 Tips:
- Check what others charge for similar notes
- Free notes get more views but no income
- Quality notes can be priced higher
- Semester exam notes are usually popular!`;
    }

    // File types
    else if (match(msg, ['file type', 'what file', 'file format', 'format', 'allowed file', 'මොන file', 'කොයි type', 'what types can i upload', 'file types upload', 'කොන් file types', 'file types upload කරන්න'])) {
      reply = ` Allowed File Types:
Upload කරන්න පුළුවන් file types:

 Documents:
  • PDF (.pdf)
  • Word (.doc, .docx)
  • PowerPoint (.ppt, .pptx)
  • Excel (.xls, .xlsx)
  • Text (.txt)

 Images:
  • JPEG (.jpg, .jpeg)
  • PNG (.png)
  • GIF (.gif)

 Max file size: 10MB

 Tip: PDF is the most popular format for notes!`;
    }

    // Download notes
    else if (match(msg, ['download note', 'how to download', 'download a purchased', 'download කරන', 'බාගන්න', 'ලබාගන්න', 'get note', 'access note', 'purchase කළ note download', 'purchase කළ note download කරන්නේ', 'note download කරන්නේ කොහොමද'])) {
      reply = ` How to Download Notes:
Notes download කරන්නේ මෙහෙමයි:

 Free Notes:
  → Note page එකේ "Download" button click කරන්න
  → ඕනෑම කෙනෙකුට download කරන්න පුළුවන්

 Paid Notes:
  1. Note page එකට ගිහිං seller ගේ bank details බලන්න
  2. Bank transfer එකක් කරන්න
  3. Payment slip upload කරන්න
  4. Seller verify කරනකම් wait කරන්න
  5. Verify උනාම "My Purchases" → Download 

 My Purchases page එකේ ඔයාගේ purchased notes ටිකම තියනවා`;
    }

    // Bookmark
    else if (match(msg, ['bookmark', 'save note', 'bookmark කරන', 'සේව්', 'save කරන', 'favorite', 'bookmarks බලන', 'note bookmark කරන්නේ', 'note bookmark කරන්නේ කොහොමද'])) {
      reply = ` How to Bookmark Notes:
Notes bookmark කරන්නේ මෙහෙමයි:

 Add Bookmark:
   Note page එකේ "Bookmark" button click කරන්න
   ඒක save වෙනවා

 View Bookmarks:
   Sidebar → My Items → Bookmarks
   ඔයාගේ save කරපු notes ටිකම මෙතන තියනවා

 Remove Bookmark:
   Bookmarks page එකේ "Remove Bookmark" click කරන්න

 Tip: Bookmark interesting notes to find them quickly later!`;
    }

    //  PAYMENTS 

    // How payment works
    else if (match(msg, ['how payment', 'how does payment', 'payment work', 'payment system', 'payment ක්‍රමය', 'ගෙවීම', 'pay කරන්නේ', 'payment කරන්නේ', 'payment කරන්නේ කොහොමද'])) {
      reply = ` How Payment Works:
Payment system එක මෙහෙම වැඩ කරන්නේ:

1 Buyer note/session එක බලනවා
2 Seller ගේ bank details පේනවා page එකේ
3 Buyer bank transfer එකක් කරනවා seller ගේ account එකට
4 Buyer payment slip එක upload කරනවා platform එකේ
5 Seller ට notification එකක් යනවා
6 Seller payment slip බලලා verify කරනවා
7 Buyer ට email + PDF receipt එකක් යනවා automatically
8 දැන් buyer ට note download / session join කරන්න පුළුවන්! 

 Direct bank transfer system - no middleman!`;
    }

    // Upload payment slip
    else if (match(msg, ['payment slip', 'slip upload', 'upload slip', 'slip එක', 'ස්ලිප්', 'slip දාන', 'payment slip upload කරන්නේ', 'payment slip upload කරන්නේ කොහොමද'])) {
      reply = ` How to Upload Payment Slip:
Payment slip upload කරන්නේ මෙහෙමයි:

1 Note/Session page එකට යන්න
2 Seller ගේ bank details බලන්න
3 Bank transfer කරන්න (online banking / branch)
4 Transfer receipt / screenshot ගන්න
5 "Upload Payment Slip" section එකේ file select කරන්න
6 "Submit Purchase" click කරන්න

 Allowed formats: JPG, PNG, GIF, WEBP, PDF
 Max size: 5MB

 Tip: Clear, readable slip = faster verification!`;
    }

    // Auto verification / verification time
    else if (match(msg, ['auto verif', 'how long', 'verification take', 'pending', 'pending කොච්චර', 'කොච්චර වෙලාවක්', 'verify වෙන්න කොච්චර', 'verify වෙන්න කොච්චර කාලයක්'])) {
      reply = ` Verification Time & Auto Verification:

 How long does verification take?
  • Seller/Host manually verify කරනවා
  • Usually few hours to 1 day
  • Depends on seller's availability

 Auto Verification:
  • FREE sessions (Type A) auto-verify වෙනවා instantly!
  • Slip upload කරන්න ඕනෑ නෑ free sessions වලට
  • Enroll click කරාම verified! 

 Paid items:
  • Payment slip upload → wait for manual verification
  • Seller gets notification → checks slip → clicks Verify

 Status meanings:
  •  Pending = waiting for seller/host to verify
  •  Verified = download/join ready!

 Tip: If taking too long, message the seller via chat!`;
    }

    // Verify payments (general)
    else if (match(msg, ['how to verify', 'verify payment', 'verify කරන', 'verification', 'වෙරිෆයි', 'confirm payment', 'payment verify කරන්නේ', 'payment verify කරන්නේ කොහොමද'])) {
      reply = ` Payment Verification:
Payment verify කරන්නේ මෙහෙමයි:

 For Sellers (verify note payments):
  1. Notification එකක් එනවා buyer purchase කරාම
  2. Sidebar → My Notes → "View Purchases"
  3. Payment slip check කරන්න ("View Slip")
  4. "Verify" button click කරන්න 
  5. Buyer ට email + PDF receipt automatically යනවා

 For Hosts (verify session enrollments):
  1. Sidebar → My Sessions → "View Enrollments"
  2. Student ගේ payment slip check කරන්න
  3. "Verify" button click කරන්න 

 Bulk Verify:
  • "Verify All Pending" button එකෙන් එකපාරටම verify කරන්න පුළුවන්!

 Free sessions auto-verify වෙනවා - slip ඕනෑ නෑ!`;
    }

    // Banks supported
    else if (match(msg, ['bank support', 'which bank', 'what bank', 'බැංකු', 'bank list', 'supported bank', 'banks are', 'banks support කරනවාද', 'මොනවා banks', 'banks supported'])) {
      reply = ` Supported Banks (30+):
Support කරන බැංකු:

 Major Banks:
  • Bank of Ceylon (BOC)
  • People's Bank
  • Commercial Bank of Ceylon
  • Hatton National Bank (HNB)
  • Sampath Bank
  • Seylan Bank
  • Nations Trust Bank (NTB)

 Other Banks:
  • DFCC Bank
  • NDB (National Development Bank)
  • PABC (Pan Asia Banking Corporation)
  • Union Bank, Amana Bank, Cargills Bank
  • NSB (National Savings Bank)

 International Banks:
  • HSBC Sri Lanka
  • Standard Chartered Bank
  • Citibank Sri Lanka
  • State Bank of India Sri Lanka

+ More! Total 30+ banks dropdown එකේ තියනවා! 🇱🇰`;
    }

    // Bank details (add/setup)
    else if (match(msg, ['bank detail', 'bank add', 'add bank', 'bank දාන', 'bank setup', 'bank එක', 'how to add bank', 'bank details add කරන්නේ', 'bank details add කරන්නේ කොහොමද'])) {
      reply = ` How to Add Bank Details:
Bank details add කරන්නේ මෙහෙමයි:

1 Profile page → Bank Details section
2 "Add Bank Details" button click කරන්න
3 Fill in:
   •  Bank Name - dropdown එකෙන් select කරන්න (30+ banks)
   •  Account Number - ඔයාගේ account number
   •  Branch - branch name
   •  Account Holder Name

4 "Save Bank Details" click කරන්න 

 Bank details add කළාම:
  • Sidebar එකේ SELLER section unlock වෙනවා 
  • Notes sell කරන්න පුළුවන්
  • Sessions host කරන්න පුළුවන්
  • Buyers ට ඔයාගේ bank details පේනවා payment කරන්න

 Registration වලදී bank details ඕනෑ නෑ - later add කරන්න!`;
    }

    //  KUPPI SESSIONS 

    // Create session
    else if (match(msg, ['create session', 'create kuppi', 'host session', 'session හදන', 'session create', 'kuppi හදන', 'kuppi create', 'create a kuppi', 'kuppi session create කරන්නේ', 'kuppi session create කරන්නේ කොහොමද'])) {
      reply = ` How to Create a Kuppi Session:
Kuppi session හදන්නේ මෙහෙමයි:

1 Bank details add කරන්න (Profile → Bank Details)
2 Sidebar → SELLER → Create Session
3 Fill the form:
   • Title - Session name
   • Description - කරන දේ විස්තරය
   • Session Type:
      Type A = Free session
      Type B = Paid individual
      Type C = Paid group
      Type D = Premium
   • Category & Subject
   • Price (Type A නම් 0)
   • MS Teams Link
   • Date, Time, Duration
   • Max Participants

4 "Create Session" click කරන්න 

 Tip: MS Teams link එක add කරන්න - verified students ට පේනවා!`;
    }

    // Enroll in session
    else if (match(msg, ['enroll', 'join session', 'session join', 'session එකට', 'enroll කරන', 'register session', 'attend session', 'enroll in a', 'session එකකට enroll', 'session එකකට enroll වෙන්නේ', 'session එකකට enroll වෙන්නේ කොහොමද'])) {
      reply = ` How to Enroll in a Kuppi Session:
Session එකකට join වෙන්නේ මෙහෙමයි:

 Free Sessions (Type A):
  1. Kuppi Sessions page → session click කරන්න
  2. "Enroll (Free)" button click කරන්න
  3. Automatically verified! 
  4. MS Teams link එක පේනවා

 Paid Sessions (Type B/C/D):
  1. Session page එකේ host ගේ bank details බලන්න
  2. Bank transfer කරන්න
  3. Payment slip upload කරන්න
  4. "Submit Enrollment" click කරන්න
  5. Host verify කරනකම් wait කරන්න
  6. Verify උනාම MS Teams link එක unlock වෙනවා 

 Check enrollment status: Session page එකේ පේනවා
  •  Pending = waiting for host
  •  Verified = can join!`;
    }

    // MS Teams link
    else if (match(msg, ['teams link', 'ms teams', 'team link', 'teams එක', 'zoom', 'meeting link', 'online class', 'get ms teams', 'ms teams link ගන්නේ', 'ms teams link ගන්නේ කොහොමද'])) {
      reply = ` MS Teams Link:
MS Teams link ගැන:

 For Hosts (Session creators):
  • Create Session form එකේ "MS Teams Link" field එකේ paste කරන්න
  • MS Teams → New Meeting → Copy link

 For Students:
  • Free sessions → Enroll කරාම link එක පේනවා
  • Paid sessions → Payment verify උනාම link එක unlock වෙනවා
  • Session page එකේ green box එකේ "Open MS Teams Link" click කරන්න

 Important:
  • Link එක host + verified students ට විතරයි පේන්නේ
  • Pending students ට link එක hide වෙලා තියනවා`;
    }

    // Verify student payments (host)
    else if (match(msg, ['verify student', 'student payment', 'verify enrollment', 'student verify', 'student payments verify', 'student payments verify කරන්නේ', 'student payments verify කරන්නේ කොහොමද'])) {
      reply = ` How to Verify Student Payments (For Hosts):
Student payments verify කරන්නේ මෙහෙමයි:

1 Notification එකක් එනවා student enroll කරාම
2 Sidebar → SELLER → My Sessions
3 Session එක expand කරන්න ("View Enrollments")
4 Student ගේ payment slip check කරන්න ("View Slip")
5 "Verify" button click කරන්න 

 After verify:
  • Student ට email + PDF receipt යනවා
  • Student ට MS Teams link unlock වෙනවා
  • Student ට notification එකක් යනවා

 Tip: "Verify All" button එකෙන් bulk verify කරන්න පුළුවන්!`;
    }

    // Excel report / export
    else if (match(msg, ['excel', 'report', 'export', 'generate report', 'generate excel', 'sales report', 'export කරන', 'රිපෝට්', 'excel report හදන්නේ', 'excel report හදන්නේ කොහොමද'])) {
      reply = ` How to Generate Excel Report:
Sales report generate කරන්නේ මෙහෙමයි:

1 Sidebar → SELLER → Analytics
2 Click "Export Excel Report" button 
3 .xlsx file එකක් download වෙනවා

 Report එකේ තියනවා:
  •  Notes Sales sheet - each note, purchases, revenue
  •  Session Sales sheet - each session, enrollments, revenue
  •  Summary sheet - total revenue, stats

 Report එකෙන් ඔයාගේ:
  - Total revenue
  - Verified vs pending payments
  - Rating averages
  - Per-item breakdown
  බලන්න පුළුවන්!`;
    }

    //  CHAT 

    // Chat with seller
    else if (match(msg, ['chat seller', 'chat with', 'message seller', 'contact seller', 'seller ට message', 'seller එක්ක', 'ask seller', 'seller ට message කරන්නේ', 'seller ට message කරන්නේ කොහොමද'])) {
      reply = ` How to Chat with a Seller:
Seller කෙනෙක්ට message කරන්නේ මෙහෙමයි:

1 Note page එකට යන්න
2 "Ask Seller" button click කරන්න
3 Chat window open වෙනවා
4 Message type කරලා send කරන්න

 Or go to Sidebar → Tools → Messages
  → ඔයාගේ conversations ටිකම මෙතන තියනවා

 Chat note/session එකට linked වෙලා තියනවා - seller ට context එක පේනවා!`;
    }

    // Send message
    else if (match(msg, ['send message', 'send a message', 'message කරන', 'message send', 'type message', 'reply', 'message send කරන්නේ', 'message send කරන්නේ කොහොමද'])) {
      reply = ` How to Send Messages:
Message send කරන්නේ මෙහෙමයි:

1 Sidebar → Tools → Messages
2 Chat list එකෙන් conversation select කරන්න
3 Bottom එකේ text box එකේ message type කරන්න
4 Send button (➤) click කරන්න

 Other person ට notification එකක් යනවා!

 New chat start කරන්න:
  Note page → "Ask Seller" button use කරන්න`;
    }

    // Unread messages
    else if (match(msg, ['unread', 'new message', 'message check', 'check unread', 'message බලන', 'notification message', 'unread messages check', 'unread messages check කරන්නේ', 'unread messages check කරන්නේ කොහොමද'])) {
      reply = ` How to Check Unread Messages:
Unread messages check කරන්නේ මෙහෙමයි:

1 Top navbar එකේ message icon click කරන්න
2 Or Sidebar → Tools → Messages

 Notifications:
  • New message එකක් ආවොත් notification එකක් එනවා
  • Top navbar එකේ bell icon එකේ count එක පේනවා
  • Click කරාම notification page එකට යනවා

 Messages page එකේ conversations list එකේ last message preview එක පේනවා!`;
    }

    //  ANALYTICS 

    // View earnings
    else if (match(msg, ['earning', 'revenue', 'income', 'money', 'ආදායම', 'earnings බලන', 'how much earned', 'total revenue', 'view my earning', 'earnings check කරන්නේ', 'earnings check කරන්නේ කොහොමද'])) {
      reply = ` How to View Your Earnings:
Earnings check කරන්නේ මෙහෙමයි:

1 Sidebar → SELLER → Analytics
2 ඔයාට පේනවා:
   •  Total Revenue (notes + sessions)
   •  Notes Revenue
   •  Sessions Revenue
   •  Pending Payments

 Dashboard (Home page) එකේත් quick stats තියනවා:
   • Total revenue
   • Notes listed
   • Sessions created

 "Export Excel Report" click කරාම detailed breakdown එකක් download කරන්න පුළුවන්!`;
    }

    // Download statistics
    else if (match(msg, ['download stat', 'download count', 'views', 'statistics', 'stats', 'බාගත', 'how many download', 'check download', 'download statistics check', 'download statistics check කරන්නේ', 'download statistics check කරන්නේ කොහොමද'])) {
      reply = ` Download & View Statistics:
Statistics check කරන්නේ මෙහෙමයි:

1️ Sidebar → SELLER → Analytics page:
   •  Total Views - ඔයාගේ notes බැලූ ගාන
   •  Total Downloads - download කළ ගාන
   •  Total Note Sales - verified purchases
   •  Session Enrollments

 Home Dashboard එකේත් overview එකක් තියනවා

 More views = better title & description!`;
    }

    // Ratings
    else if (match(msg, ['rating', 'review', 'feedback', 'star', 'stars', 'rate', 'ශ්‍රේණිගත', 'ratings බලන', 'my rating', 'see my rating', 'ratings check කරන්නේ', 'ratings check කරන්නේ කොහොමද'])) {
      reply = ` Ratings & Feedback:
Ratings system ගැන:

 Leave Feedback:
  • Note purchase verify උනාම / Free note download කරාම
  • Session enroll verify උනාම
  • Item page → Feedback section → Rate 1-5  + comment

 View Your Ratings:
  • Analytics page → Average Rating card එක
  • Each note/session page එකේ feedback section එකේ

Seller ට notification එකක් යනවා new feedback ආවොත්!

Good ratings = more buyers trust you!`;
    }

    //  ACCOUNT 

    // Update profile
    else if (match(msg, ['update profile', 'update my profile', 'edit profile', 'change name', 'profile update', 'profile change', 'profile එක', 'profile update කරන්නේ', 'profile update කරන්නේ කොහොමද'])) {
      reply = ` How to Update Profile:
Profile update කරන්නේ මෙහෙමයි:

1 Top right → Click your name → Profile
   Or navbar dropdown → Profile

2 Personal Information section:
   • Full Name - change කරන්න පුළුවන්
   • Email - change කරන්න බෑ (SLIIT email)
   • Phone Number - update කරන්න පුළුවන්

3 "Update Profile" click කරන්න `;
    }

    // Change password
    else if (match(msg, ['change password', 'password change', 'password update', 'new password', 'reset password', 'මුරපදය', 'password වෙනස්', 'password change කරන්නේ', 'password change කරන්නේ කොහොමද'])) {
      reply = ` How to Change Password:
Password change කරන්නේ මෙහෙමයි:

1 Profile page එකට යන්න
2 "Change Password" section scroll කරන්න
3 Fill in:
   • Current Password - දැන් තියන password
   • New Password - අලුත් password (min 6 characters)
   • Confirm New Password - නැවත type කරන්න

4 "Change Password" click කරන්න 

 Password must be at least 6 characters!
 Strong password use කරන්න - mix letters, numbers, symbols!`;
    }

    // Register
    else if (match(msg, ['register', 'sign up', 'create account', 'new account', 'registration', 'ලියාපදිංචි', 'account හදන', 'how to register', 'register වෙන්නේ', 'register වෙන්නේ කොහොමද'])) {
      reply = ` How to Register:
Account හදන්නේ මෙහෙමයි:

1 Login page → "Register" link click කරන්න
2 Fill in:
   • Full Name - ඔයාගේ නම
   • SLIIT Email - must end with @my.sliit.lk 
   • Phone Number - mobile number
   • Password - min 6 characters
   • Confirm Password

3 "Register" click කරන්න 

Important:
  • ONLY @my.sliit.lk emails allowed
  • Bank details ඕනෑ නෑ registration වලදී
  • Later add කරන්න පුළුවන් selling start කරන්න ඕනෑ වුනාම

 Registration free! ඕනෑම SLIIT student කෙනෙකුට join වෙන්න පුළුවන්!`;
    }

    //  GENERAL HELP

    else if (match(msg, ['help', 'support', 'what can you do', 'උදව්', 'help me', 'how to use', 'guide', 'tutorial', 'උදව් කරන්නේ', 'කොහොමද'])) {
      reply = ` AI Helper - මට උදව් කරන්න පුළුවන් දේවල්:

 Notes ගැන:
  • "How do I upload notes?" - notes upload කරන හැටි
  • "How to set price?" - මිල දාන හැටි
  • "What file types can I upload?" - allowed files
  • "How to download?" - download කරන හැටි
  • "How to bookmark?" - bookmark කරන හැටි

  Payment ගැන:
  • "How does payment work?" - payment system
  • "How to upload payment slip?" - slip upload කරන හැටි
  • "How to verify payments?" - verification process
  • "How long does verification take?" - time & auto verify
  • "What banks are supported?" - supported banks

 Kuppi Sessions ගැන:
  • "How to create a kuppi session?" - session හදන හැටි
  • "How to enroll in a session?" - join වෙන හැටි
  • "How to get MS Teams link?" - link ගැන
  • "How to verify student payments?" - student verify කරන හැටි
  • "How to generate Excel report?" - report generate කරන හැටි

 Chat: "How to chat with a seller?" / "How to send a message?"
 Analytics: "How to view my earnings?" / "Check download statistics"
 Account: "How to add bank details?" / "Change password?" / "How to register?"

ඕනෑම දෙයක් Sinhala හෝ English වලින් අහන්න! `;
    }

    // SINHALA CATCH-ALL PATTERNS 

    else if (match(msg, ['notes ගැන', 'notes කියන්නේ', 'notes මොනවද'])) {
      reply = ` Notes Marketplace ගැන:

SLIIT students ලට notes share කරන්න / sell කරන්න පුළුවන් platform එකක්!

 Free notes - ඕනෑම කෙනෙකුට download කරන්න පුළුවන්
 Paid notes - bank transfer කරලා buy කරන්න පුළුවන්

Notes Marketplace → browse කරන්න
Category, subject wise filter කරන්න පුළුවන්
Search bar එකෙන් search කරන්න පුළුවන්

"How to upload notes?" කියලා අහන්න upload ගැන දැනගන්න!`;
    }

    else if (match(msg, ['kuppi කියන්නේ', 'kuppi මොනවද', 'session ගැන', 'kuppi ගැන'])) {
      reply = ` Kuppi Sessions ගැන:

Students ලා organize කරන online study sessions!

Session Types:
 Type A = Free - ඕනෑම කෙනෙකුට join වෙන්න පුළුවන්
 Type B = Paid Individual - individual tutoring
 Type C = Paid Group - group study session
 Type D = Premium - premium content

MS Teams link එකෙන් online join වෙන්න පුළුවන්!
"How to create session?" / "How to enroll?" කියලා details අහන්න!`;
    }

    else if (match(msg, ['thanks', 'thank you', 'ස්තුති', 'thanks a lot', 'nice', 'great', 'good', 'ok', 'okay'])) {
      reply = ` You're welcome! ස්තුතියි!

ඕනෑම වෙලාවක අහන්න - I'm always here to help! 
Feel free to ask anything else about the platform!`;
    }

    //DEFAULT 

    else {
      reply = ` I'm not sure about that. ඒක ගැන මට හරියටම තේරුනේ නෑ.

Try asking about these topics / මේ ගැන අහලා බලන්න:

 Notes: "How to upload notes?" / "How to download?"
 Payment: "How does payment work?" / "What banks supported?"
 Sessions: "How to create kuppi session?" / "How to enroll?"
 Chat: "How to message seller?"
 Analytics: "How to view earnings?"
 Account: "How to add bank details?" / "Change password?"

Or type "help" for full guide!
"help" type කරන්න full guide එකට! `;
    }

    // Filter reply by selected language
    const hasSinhala = (line) => /[\u0D80-\u0DFF]/.test(line);

    if (lang === 'en') {
      // English mode: remove lines that are primarily Sinhala
      reply = reply
        .split('\n')
        .filter(line => {
          const sinhalaChars = (line.match(/[\u0D80-\u0DFF]/g) || []).length;
          const totalChars = line.replace(/\s/g, '').length;
          // Keep line if less than 40% sinhala characters
          return totalChars === 0 || (sinhalaChars / totalChars) < 0.4;
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } else if (lang === 'si') {
      // Sinhala mode: remove lines that are purely English (no sinhala at all)
      // But keep lines with numbers, bullets, symbols
      reply = reply
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return true; // keep blank lines for spacing
          // Keep if has any sinhala characters
          if (hasSinhala(trimmed)) return true;
          // Keep if it's a number/bullet/symbol line (like "1", "•", etc.)
          if (/^[\d\s•\-\*→►▶]+$/.test(trimmed)) return true;
          // Remove pure English lines
          return false;
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: 'Chatbot error', error: error.message });
  }
};