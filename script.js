import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIG
========================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCVfOiQBcfljpB6l5CnyZCM0_phDQ2zSgI",
    authDomain: "vsvchat-c7289.firebaseapp.com",
    projectId: "vsvchat-c7289",
    storageBucket: "vsvchat-c7289.firebasestorage.app",
    messagingSenderId: "675462160365",
    appId: "1:675462160365:web:34e5ad39ca2e57500dd1e4",
    measurementId: "G-FMP7BT8HM3"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================
   ELEMENTS
========================================= */

const authScreen =
    document.getElementById("authScreen");

const chatScreen =
    document.getElementById("chatScreen");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const signupBtn =
    document.getElementById("signupBtn");

const authStatus =
    document.getElementById("authStatus");

const logoutBtn =
    document.getElementById("logoutBtn");

const currentUserDisplay =
    document.getElementById("currentUser");

const messagesDiv =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendBtn =
    document.getElementById("sendBtn");

const chatTitle =
    document.getElementById("chatTitle");

const chatCodeDisplay =
    document.getElementById("chatCode");

const generalBtn =
    document.getElementById("generalBtn");

const chatList =
    document.getElementById("chatList");

const createChatBtn =
    document.getElementById("createChatBtn");

const joinChatBtn =
    document.getElementById("joinChatBtn");

const createChatModal =
    document.getElementById("createChatModal");

const joinChatModal =
    document.getElementById("joinChatModal");

const newChatName =
    document.getElementById("newChatName");

const newChatPassword =
    document.getElementById("newChatPassword");

const chatCodeInput =
    document.getElementById("chatCodeInput");

const joinChatPassword =
    document.getElementById("joinChatPassword");

const confirmCreateChat =
    document.getElementById("confirmCreateChat");

const cancelCreateChat =
    document.getElementById("cancelCreateChat");

const confirmJoinChat =
    document.getElementById("confirmJoinChat");

const cancelJoinChat =
    document.getElementById("cancelJoinChat");

const createStatus =
    document.getElementById("createStatus");

const joinStatus =
    document.getElementById("joinStatus");


/* =========================================
   VARIABLES
========================================= */

let currentUsername = "";

let currentChatId = "GENERAL";

let unsubscribeMessages = null;

let joinedChats = {};


/* =========================================
   USERNAME → INTERNAL EMAIL
========================================= */

function usernameToEmail(username) {

    return `${username.toLowerCase()}@vsvchat.app`;

}


/* =========================================
   USERNAME VALIDATION
========================================= */

function validUsername(username) {

    return /^[a-zA-Z0-9_]{3,20}$/.test(username);

}


/* =========================================
   PASSWORD HASHING
========================================= */

async function hashPassword(password, salt) {

    const encoder =
        new TextEncoder();

    const data =
        encoder.encode(
            password + salt
        );

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    const hashArray =
        Array.from(
            new Uint8Array(hashBuffer)
        );

    return hashArray
        .map(
            byte =>
                byte.toString(16).padStart(2, "0")
        )
        .join("");

}


/* =========================================
   RANDOM SALT
========================================= */

function generateSalt() {

    const array =
        new Uint8Array(16);

    crypto.getRandomValues(array);

    return Array.from(array)
        .map(
            byte =>
                byte.toString(16).padStart(2, "0")
        )
        .join("");

}


/* =========================================
   CREATE ACCOUNT
========================================= */

signupBtn.addEventListener(
    "click",
    async () => {

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        if (!validUsername(username)) {

            authStatus.textContent =
                "Username must be 3-20 characters and use only letters, numbers or _.";

            return;

        }


        if (password.length < 6) {

            authStatus.textContent =
                "Password must be at least 6 characters.";

            return;

        }


        try {

            authStatus.textContent =
                "Creating account...";


            const email =
                usernameToEmail(username);


            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            await setDoc(
                doc(
                    db,
                    "users",
                    user.uid
                ),
                {
                    username: username,

                    usernameLower:
                        username.toLowerCase(),

                    uid:
                        user.uid,

                    joinedChats: {},

                    createdAt:
                        serverTimestamp()
                }
            );


            authStatus.textContent =
                "Account created!";


        } catch (error) {

            console.error(error);


            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                authStatus.textContent =
                    "That username is already taken.";

            } else {

                authStatus.textContent =
                    error.message;

            }

        }

    }
);


/* =========================================
   LOGIN
========================================= */

loginBtn.addEventListener(
    "click",
    async () => {

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;


        if (!validUsername(username)) {

            authStatus.textContent =
                "Enter a valid username.";

            return;

        }


        if (!password) {

            authStatus.textContent =
                "Enter your password.";

            return;

        }


        try {

            authStatus.textContent =
                "Logging in...";


            const email =
                usernameToEmail(username);


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        } catch (error) {

            console.error(error);


            if (
                error.code ===
                "auth/invalid-credential" ||
                error.code ===
                "auth/user-not-found" ||
                error.code ===
                "auth/wrong-password"
            ) {

                authStatus.textContent =
                    "Incorrect username or password.";

            } else {

                authStatus.textContent =
                    error.message;

            }

        }

    }
);


/* =========================================
   LOAD USER DATA
========================================= */

async function loadUserData(user) {

    try {

        const userDoc =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );


        if (userDoc.exists()) {

            const data =
                userDoc.data();


            currentUsername =
                data.username ||
                user.email.split("@")[0];


            joinedChats =
                data.joinedChats || {};

        } else {

            currentUsername =
                user.email.split("@")[0];

            joinedChats = {};

        }


        currentUserDisplay.textContent =
            `@${currentUsername}`;


    } catch (error) {

        console.error(
            "Could not load user:",
            error
        );

        currentUsername =
            user.email.split("@")[0];

        joinedChats = {};

    }

}


/* =========================================
   LOAD JOINED CHATS INTO SIDEBAR
========================================= */

async function loadJoinedChats() {

    chatList.innerHTML = "";


    const chatCodes =
        Object.keys(joinedChats);


    for (const code of chatCodes) {

        try {

            const chatDoc =
                await getDoc(
                    doc(
                        db,
                        "chats",
                        code
                    )
                );


            if (!chatDoc.exists()) {

                continue;

            }


            const data =
                chatDoc.data();


            addChatToSidebar(
                code,
                data.name
            );


        } catch (error) {

            console.error(
                "Could not load chat:",
                error
            );

        }

    }

}


/* =========================================
   SAVE CHAT MEMBERSHIP
========================================= */

async function saveChatMembership(
    chatCode,
    chatName
) {

    const user =
        auth.currentUser;


    if (!user) return;


    joinedChats[chatCode] =
        chatName;


    await setDoc(
        doc(
            db,
            "users",
            user.uid
        ),
        {
            joinedChats:
                joinedChats
        },
        {
            merge: true
        }
    );

}


/* =========================================
   AUTH STATE
========================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            authScreen.style.display =
                "none";

            chatScreen.style.display =
                "flex";


            await loadUserData(user);

            await loadJoinedChats();


            /* ALWAYS OPEN GENERAL */

            await openChat("GENERAL");


        } else {

            authScreen.style.display =
                "flex";

            chatScreen.style.display =
                "none";


            currentUsername = "";

            joinedChats = {};


            if (unsubscribeMessages) {

                unsubscribeMessages();

                unsubscribeMessages = null;

            }

        }

    }
);


/* =========================================
   LOGOUT
========================================= */

logoutBtn.addEventListener(
    "click",
    async () => {

        await signOut(auth);

    }
);


/* =========================================
   OPEN CHAT
========================================= */

async function openChat(chatId) {

    const user =
        auth.currentUser;


    if (!user) return;


    /* GENERAL IS ALWAYS AVAILABLE */

    if (chatId !== "GENERAL") {

        if (!joinedChats[chatId]) {

            alert(
                "You have not joined this chat."
            );

            return;

        }

    }


    currentChatId =
        chatId;


    messagesDiv.innerHTML = "";

    chatCodeDisplay.textContent = "";


    /* GENERAL */

    if (chatId === "GENERAL") {

        chatTitle.textContent =
            "# GENERAL";

        chatCodeDisplay.textContent =
            "Everyone can join this chat.";

    }


    /* CUSTOM CHAT */

    else {

        const chatDoc =
            await getDoc(
                doc(
                    db,
                    "chats",
                    chatId
                )
            );


        if (!chatDoc.exists()) {

            alert(
                "This chat no longer exists."
            );

            return;

        }


        const data =
            chatDoc.data();


        chatTitle.textContent =
            `# ${data.name}`;

        chatCodeDisplay.textContent =
            `CODE: ${data.code}`;

    }


    /* REMOVE OLD LISTENER */

    if (unsubscribeMessages) {

        unsubscribeMessages();

    }


    /* MESSAGE COLLECTION */

    const messagesRef =
        collection(
            db,
            "chats",
            chatId,
            "messages"
        );


    const messagesQuery =
        query(
            messagesRef,
            orderBy(
                "timestamp",
                "asc"
            )
        );


    /* REAL-TIME LISTENER */

    unsubscribeMessages =
        onSnapshot(
            messagesQuery,
            snapshot => {

                messagesDiv.innerHTML = "";


                snapshot.forEach(
                    messageDoc => {

                        const data =
                            messageDoc.data();

                        displayMessage(data);

                    }
                );


                messagesDiv.scrollTop =
                    messagesDiv.scrollHeight;

            },
            error => {

                console.error(
                    "Message listener error:",
                    error
                );

            }
        );

}


/* =========================================
   DISPLAY MESSAGE
========================================= */

function displayMessage(data) {

    const message =
        document.createElement("div");

    message.className =
        "message";


    const username =
        document.createElement("strong");

    username.textContent =
        data.username || "Unknown";


    const text =
        document.createElement("span");

    text.textContent =
        data.text || "";


    message.appendChild(
        username
    );

    message.appendChild(
        text
    );


    messagesDiv.appendChild(
        message
    );

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) return;


    const user =
        auth.currentUser;


    if (!user) return;


    messageInput.value = "";


    try {

        await addDoc(
            collection(
                db,
                "chats",
                currentChatId,
                "messages"
            ),
            {
                text:
                    text,

                username:
                    currentUsername,

                uid:
                    user.uid,

                timestamp:
                    serverTimestamp()
            }
        );


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );

        alert(
            "Could not send message."
        );

    }

}


sendBtn.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            sendMessage();

        }

    }
);


/* =========================================
   GENERAL CHAT
========================================= */

generalBtn.addEventListener(
    "click",
    () => {

        openChat("GENERAL");

    }
);


/* =========================================
   CREATE CHAT
========================================= */

createChatBtn.addEventListener(
    "click",
    () => {

        newChatName.value = "";

        newChatPassword.value = "";

        createStatus.textContent = "";

        createChatModal.style.display =
            "flex";

        newChatName.focus();

    }
);


cancelCreateChat.addEventListener(
    "click",
    () => {

        createChatModal.style.display =
            "none";

    }
);


/* =========================================
   CONFIRM CREATE CHAT
========================================= */

confirmCreateChat.addEventListener(
    "click",
    async () => {

        const name =
            newChatName.value.trim();

        const password =
            newChatPassword.value;


        if (!name) {

            createStatus.textContent =
                "Enter a chat name.";

            return;

        }


        if (password.length < 4) {

            createStatus.textContent =
                "Chat password must be at least 4 characters.";

            return;

        }


        try {

            createStatus.textContent =
                "Creating...";


            const code =
                generateChatCode();


            const salt =
                generateSalt();


            const passwordHash =
                await hashPassword(
                    password,
                    salt
                );


            /* CREATE CHAT */

            await setDoc(
                doc(
                    db,
                    "chats",
                    code
                ),
                {
                    name:
                        name,

                    code:
                        code,

                    owner:
                        auth.currentUser.uid,

                    createdBy:
                        currentUsername,

                    passwordHash:
                        passwordHash,

                    passwordSalt:
                        salt,

                    createdAt:
                        serverTimestamp()
                }
            );


            /* SAVE MEMBERSHIP */

            await saveChatMembership(
                code,
                name
            );


            /* ADD TO SIDEBAR */

            addChatToSidebar(
                code,
                name
            );


            /* CLOSE MODAL */

            createChatModal.style.display =
                "none";


            /* OPEN CHAT */

            await openChat(code);


            alert(
                `Chat created!\n\nChat Code: ${code}`
            );


        } catch (error) {

            console.error(error);

            createStatus.textContent =
                error.message;

        }

    }
);


/* =========================================
   GENERATE CHAT CODE
========================================= */

function generateChatCode() {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


    let code = "";


    for (
        let i = 0;
        i < 6;
        i++
    ) {

        code +=
            characters.charAt(
                Math.floor(
                    Math.random() *
                    characters.length
                )
            );

    }


    return code;

}


/* =========================================
   JOIN CHAT
========================================= */

joinChatBtn.addEventListener(
    "click",
    () => {

        chatCodeInput.value = "";

        joinChatPassword.value = "";

        joinStatus.textContent = "";

        joinChatModal.style.display =
            "flex";

        chatCodeInput.focus();

    }
);


cancelJoinChat.addEventListener(
    "click",
    () => {

        joinChatModal.style.display =
            "none";

    }
);


/* =========================================
   CONFIRM JOIN CHAT
========================================= */

confirmJoinChat.addEventListener(
    "click",
    async () => {

        const code =
            chatCodeInput.value
                .trim()
                .toUpperCase();


        const password =
            joinChatPassword.value;


        if (code.length !== 6) {

            joinStatus.textContent =
                "Enter a 6-character chat code.";

            return;

        }


        if (!password) {

            joinStatus.textContent =
                "Enter the chat password.";

            return;

        }


        try {

            joinStatus.textContent =
                "Checking chat...";


            /* FIND CHAT */

            const chatDoc =
                await getDoc(
                    doc(
                        db,
                        "chats",
                        code
                    )
                );


            if (!chatDoc.exists()) {

                joinStatus.textContent =
                    "Chat not found.";

                return;

            }


            const data =
                chatDoc.data();


            /* HASH ENTERED PASSWORD */

            const enteredHash =
                await hashPassword(
                    password,
                    data.passwordSalt
                );


            /* CHECK PASSWORD */

            if (
                enteredHash !==
                data.passwordHash
            ) {

                joinStatus.textContent =
                    "Incorrect chat password.";

                return;

            }


            /* SAVE MEMBERSHIP */

            await saveChatMembership(
                code,
                data.name
            );


            /* ADD SIDEBAR */

            addChatToSidebar(
                code,
                data.name
            );


            /* CLOSE MODAL */

            joinChatModal.style.display =
                "none";


            /* OPEN CHAT */

            await openChat(code);


        } catch (error) {

            console.error(error);

            joinStatus.textContent =
                "Could not join chat.";

        }

    }
);


/* =========================================
   ADD CHAT TO SIDEBAR
========================================= */

function addChatToSidebar(
    code,
    name
) {

    /* DON'T ADD DUPLICATES */

    if (
        document.querySelector(
            `[data-chat="${code}"]`
        )
    ) {

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.className =
        "chatButton";


    button.dataset.chat =
        code;


    button.textContent =
        `# ${name}`;


    button.addEventListener(
        "click",
        async () => {

            await openChat(code);

        }
    );


    chatList.appendChild(
        button
    );

}