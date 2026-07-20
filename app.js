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
const wishPersonSubtitle = document.getElementById("wish-person-subtitle");
const backLink = document.getElementById("back-link");
const subtitle = document.getElementById("subtitle");
const hero = document.getElementById("hero");
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

const PERSON_STYLES = {
  Elisa: {
    bg: "#dcebd9",
    color: "#4f7d5c",
    icon: '<path d="M12 3c-2 0-3.5 1.5-3.5 3.5S10 10 12 10s3.5-1.5 3.5-3.5S14 3 12 3Z"/><path d="M12 10v11"/><path d="M12 15c-2 0-4 1-4 3"/><path d="M12 15c2 0 4 1 4 3"/>'
  },
  Enno: {
    bg: "#dde6f5",
    color: "#3f6bab",
    icon: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v4M5 12h4"/><circle cx="16" cy="10.5" r="1"/><circle cx="18.3" cy="13" r="1"/>'
  },
  Basti: {
    bg: "#f5e6cc",
    color: "#c9822f",
    icon: '<path d="M3 14c0-1 1-2 3-2h12c2 0 3 1 3 2"/><path d="M2 14h20"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/>'
  },
  Nina: {
    bg: "#f6dde4",
    color: "#c85770",
    icon: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>'
  }
};

function renderPersonGrid(people) {
  personSelect.innerHTML = "";
  people.forEach((person) => {
    const style = PERSON_STYLES[person] || { bg: "#eee", color: "#666", icon: "" };
    const card = document.createElement("div");
    card.className = "person-card";
    card.innerHTML =
      '<span class="person-icon" style="background:' + style.bg + '; color:' + style.color + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + style.icon + '</svg>' +
      '</span>' +
      '<span class="person-name">' + person + '</span>' +
      '<svg class="person-chevron" viewBox="0 0 24 24" fill="none" stroke="' + style.color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
    card.addEventListener("click", () => showPerson(person));
    personSelect.appendChild(card);
  });
}

function showPerson(person) {
  currentPerson = person;
  wishPersonTitle.innerHTML = `${person}s Wunschzettel <span class="heart">🧡</span>`;
  wishPersonSubtitle.textContent = `Hier findest du ${person}s aktuelle Wünsche. Reserviere einen Wunsch, damit es keine doppelten Geschenke gibt.`;
  hero.classList.add("hero--compact");
  personSelect.parentElement.classList.add("hidden");
  subtitle.classList.add("hidden");
  wishView.classList.remove("hidden");
  renderWishes();
}

function showPersonSelect() {
  currentPerson = null;
  wishView.classList.add("hidden");
  hero.classList.remove("hero--compact");
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

    const top = document.createElement("div");
    top.className = "wish-card-top";

    const info = document.createElement("div");
    info.className = "wish-info";

    const title = document.createElement("div");
    title.className = "wish-title";
    title.textContent = wish.title;
    info.appendChild(title);

    if (wish.description) {
      const desc = document.createElement("div");
      desc.className = "wish-desc";
      desc.textContent = wish.description;
      info.appendChild(desc);
    }

    top.appendChild(info);
    card.appendChild(top);

    const bottom = document.createElement("div");
    bottom.className = "wish-card-bottom";

    if (wish.price) {
      const priceChip = document.createElement("span");
      priceChip.className = "pill-sm price-chip";
      priceChip.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.58a2 2 0 0 0 2.83 0l5.66-5.66a2 2 0 0 0 0-2.83Z"/><circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none"/></svg><span>' +
        wish.price +
        "</span>";
      bottom.appendChild(priceChip);
    }

    if (wish.link && !isReserved) {
      const link = document.createElement("a");
      link.href = wish.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "pill-sm link-btn";
      link.innerHTML = 'zum Produkt <span class="pill-arrow">→</span>';
      link.addEventListener("click", (e) => e.stopPropagation());
      bottom.appendChild(link);
    }

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    if (isReserved) {
      actionBtn.className = "pill-sm reserve-btn reserved-state";
      actionBtn.innerHTML = '<span class="reserve-icon">✓</span> Reserviert!';
      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        unreserve(wish.id);
      });
    } else {
      actionBtn.className = "pill-sm reserve-btn";
      actionBtn.innerHTML = '<span class="reserve-icon">🎁</span> Reservieren';
      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        reserve(wish.id);
      });
    }
    bottom.appendChild(actionBtn);

    card.appendChild(bottom);

    if (!isReserved) {
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
