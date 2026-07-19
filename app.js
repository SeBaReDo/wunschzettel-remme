import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const reservationsCol = collection(db, "reservations");

const personSelect = document.getElementById("person-select");
const wishView = document.getElementById("wish-view");
const wishList = document.getElementById("wish-list");
const wishPersonTitle = document.getElementById("wish-person-title");
const backLink = document.getElementById("back-link");
const subtitle = document.getElementById("subtitle");
const infoBanner = document.getElementById("info-banner");
const infoBannerClose = document.getElementById("info-banner-close");

let allWishes = [];
let reservations = {}; // id -> true/false
let currentPerson = null;

async function loadData() {
  const res = await fetch("data.json");
  const data = await res.json();
  allWishes = data.wishes;
  renderPersonGrid(data.people);
}

function renderPersonGrid(people) {
  personSelect.innerHTML = "";
  people.forEach((person) => {
    const card = document.createElement("div");
    card.className = "person-card";
    card.textContent = person;
    card.addEventListener("click", () => showPerson(person));
    personSelect.appendChild(card);
  });
}

function showPerson(person) {
  currentPerson = person;
  wishPersonTitle.textContent = `Wünsche von ${person}`;
  personSelect.parentElement.classList.add("hidden");
  subtitle.classList.add("hidden");
  wishView.classList.remove("hidden");
  renderWishes();
}

function showPersonSelect() {
  currentPerson = null;
  wishView.classList.add("hidden");
  subtitle.classList.remove("hidden");
  personSelect.parentElement.classList.remove("hidden");
}

function renderWishes() {
  const wishes = allWishes.filter((w) => w.person === currentPerson);
  wishList.innerHTML = "";

  if (wishes.length === 0) {
    wishList.innerHTML = '<p class="hint">Keine offenen Wünsche.</p>';
    return;
  }

  wishes.forEach((wish) => {
    const isReserved = !!reservations[wish.id];

    const card = document.createElement("div");
    card.className = "wish-card" + (isReserved ? " reserved" : "");

    const title = document.createElement("div");
    title.className = "wish-title";
    title.textContent = wish.title;
    card.appendChild(title);

    if (wish.description) {
      const desc = document.createElement("div");
      desc.className = "wish-desc";
      desc.textContent = wish.description;
      card.appendChild(desc);
    }

    const meta = document.createElement("div");
    meta.className = "wish-meta";

    if (wish.price) {
      const price = document.createElement("span");
      price.textContent = wish.price;
      meta.appendChild(price);
    }

    if (wish.link) {
      const link = document.createElement("a");
      link.href = wish.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Zum Produkt";
      link.addEventListener("click", (e) => e.stopPropagation());
      meta.appendChild(link);
    }

    if (isReserved) {
      const badge = document.createElement("span");
      badge.className = "reserved-badge";
      badge.textContent = "Reserviert";
      meta.appendChild(badge);

      const undoBtn = document.createElement("button");
      undoBtn.className = "undo-btn";
      undoBtn.textContent = "Rückgängig";
      undoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        unreserve(wish.id);
      });
      meta.appendChild(undoBtn);
    }

    card.appendChild(meta);

    if (!isReserved) {
      const tapHint = document.createElement("span");
      tapHint.className = "tap-hint";
      tapHint.textContent = "Tippen zum Reservieren →";
      card.appendChild(tapHint);

      card.addEventListener("click", () => reserve(wish.id));
    }

    wishList.appendChild(card);
  });
}

async function reserve(wishId) {
  await setDoc(doc(reservationsCol, wishId), {
    reserved: true,
    at: serverTimestamp()
  });
}

async function unreserve(wishId) {
  await deleteDoc(doc(reservationsCol, wishId));
}

function listenToReservations() {
  onSnapshot(reservationsCol, (snapshot) => {
    reservations = {};
    snapshot.forEach((docSnap) => {
      reservations[docSnap.id] = true;
    });
    if (currentPerson) {
      renderWishes();
    }
  });
}

backLink.addEventListener("click", showPersonSelect);

infoBannerClose.addEventListener("click", () => {
  infoBanner.classList.add("hidden");
});

loadData();
listenToReservations();
