/* ========= 關閉廣告蓋版 ========= */
document.getElementById("promoteCloseBtn").addEventListener("click", () => {
	document.getElementById("overlayPromote").style.display = "none";
	clearInterval(adRotateTimer);
});

/* ========= 廣告圖片輪播 ========= */
const adImages = document.querySelectorAll(".overlay-promote .promote-img");
let adIndex = 0;
const adRotateTimer = setInterval(() => {
	adImages[adIndex].classList.remove("active");
	adIndex = (adIndex + 1) % adImages.length;
	adImages[adIndex].classList.add("active");
}, 2000);

/* ========= 自動加上 openExternalBrowser 參數 ========= */
(function() {
	const url = new URL(window.location.href);
	if (!url.searchParams.has('openExternalBrowser')) {
		url.searchParams.set('openExternalBrowser', '1');
		window.location.replace(url.toString());
	}
})();

/* ========= 產生商品 ========= */
const menu = document.getElementById("menu");
const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
let allProducts = [];

function renderProducts(products) {
	menu.innerHTML = '';
	products.forEach(p => {
		const item = document.createElement("div");
		item.className = parseInt(p.qty) === 0 ? "item sold-out" : "item";
		const displayName = p.display_name || p.name;

		const img = document.createElement("img");
		img.src = `./image/${p.name}.jpg`;
		img.alt = displayName;
		item.addEventListener("click", () => openLightbox(img.src, displayName, p.price));

		const bottomHTML = isAdmin && p.bottom != null ?
			`<div class="price" style="color:#c0392b;">底價 NT$ ${p.bottom}</div>` :
			'';

		const info = document.createElement("div");
		info.className = "info";
		info.innerHTML = `
      <div class="name">${displayName}</div>
      <div class="meta">
        <div class="price">NT$ ${p.price}</div>
        <div class="qty">剩餘 ${p.qty}</div>
      </div>
      ${bottomHTML}
    `;

		if (p.category && p.category.includes("全新")) {
			const badge = document.createElement("img");
			badge.src = "./image/brandnew.png";
			badge.className = "brandnew-badge";
			item.appendChild(badge);
		}

		item.appendChild(img);
		item.appendChild(info);
		menu.appendChild(item);
	});
}

// fetch('./products.json?t=' + Math.random())
fetch('./api/data?t=' + Math.random())
	.then(res => res.json())
	.then(products => {
		for (var i = 0; i < products.length; i++) {
			if (products[i].price <= 50)
				products[i].category.push("銅板價");
		}
		allProducts = products;
		renderProducts(allProducts);
	});

/* ========= 標籤篩選 ========= */
const activeTags = new Set();
document.getElementById("tagFilter").addEventListener("click", e => {
	const tag = e.target.closest('.tag');
	if (!tag) return;
	const value = tag.dataset.tag;
	if (activeTags.has(value)) {
		activeTags.delete(value);
		tag.classList.remove("active");
	} else {
		activeTags.add(value);
		tag.classList.add("active");
	}
	if (activeTags.size === 0) {
		renderProducts(allProducts);
	} else {
		renderProducts(allProducts.filter(p =>
			p.category && p.category.some(c => activeTags.has(c))
		));
	}
});

/* ========= Lightbox + 手勢 ========= */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

let scale = 1,
	startScale = 1;
let posX = 0,
	posY = 0;
let startX = 0,
	startY = 0;
let lastTouchDistance = 0;

function updateTransform() {
	lightboxImg.style.transform =
		`translate(${posX}px, ${posY}px) scale(${scale})`;
}

function getDistance(t1, t2) {
	return Math.hypot(
		t2.clientX - t1.clientX,
		t2.clientY - t1.clientY
	);
}

const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxPrice = document.getElementById("lightboxPrice");

function openLightbox(src, title, price) {
	lightboxImg.src = src;
	lightboxTitle.textContent = title || "";
	lightboxPrice.textContent = price != null ? `NT$ ${price}` : "";
	scale = 1;
	posX = 0;
	posY = 0;
	updateTransform();
	lightbox.classList.add("show");
}

lightboxImg.addEventListener("touchstart", e => {
	if (e.touches.length === 1) {
		startX = e.touches[0].clientX - posX;
		startY = e.touches[0].clientY - posY;
	}
	if (e.touches.length === 2) {
		lastTouchDistance = getDistance(e.touches[0], e.touches[1]);
		startScale = scale;
	}
});

lightboxImg.addEventListener("touchmove", e => {
	e.preventDefault();

	if (e.touches.length === 1) {
		posX = e.touches[0].clientX - startX;
		posY = e.touches[0].clientY - startY;
		updateTransform();
	}

	if (e.touches.length === 2) {
		const newDistance = getDistance(e.touches[0], e.touches[1]);
		scale = Math.min(Math.max(startScale * (newDistance / lastTouchDistance), 1), 4);
		updateTransform();
	}
}, {
	passive: false
});

lightboxImg.addEventListener("touchend", e => {
	if (e.touches.length === 1) {
		// 從雙指變單指時，重新計算起始位置以避免圖片跳動
		startX = e.touches[0].clientX - posX;
		startY = e.touches[0].clientY - posY;
	}
});

lightbox.addEventListener("click", () => {
	lightbox.classList.remove("show");
	lightboxImg.src = "";
	scale = 1;
	posX = 0;
	posY = 0;
});

/* ========= 複製帳號功能 ========= */
document.getElementById("copy-btn").addEventListener("click", () => {
	const accountText = document.getElementById("account").textContent;
	navigator.clipboard.writeText(accountText).then(() => {
		const btn = document.getElementById("copy-btn");
		const originalText = btn.textContent;
		btn.textContent = "複製成功！";
		setTimeout(() => {
			btn.textContent = originalText;
		}, 2000);
	});
});

const sentinel = document.getElementById("tagFilterSentinel");
const tagFilter = document.getElementById("tagFilter");
new IntersectionObserver(([e]) => {
	tagFilter.classList.toggle("stuck", !e.isIntersecting);
}).observe(sentinel);