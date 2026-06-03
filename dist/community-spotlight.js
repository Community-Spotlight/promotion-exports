/**
 * Community Spotlight
 *
 * This script can be imported directly into your HTML page or pasted into your JS.
 * Documentation is available at <https://community-spotlight.github.io/?page=developers>
 *
 * By: Community Spotlight Team
 * Licence: MIT
 * Version: 2.0.02
 */
(function () {
  /* Constants */
  const DOM_NAME = "promo-space";
  const HOST_URL = "https://cdn.jsdelivr.net/gh/Community-Spotlight/";
  const MEDIA_TYPES = [
    { accept: ["image", "images", "img"], value: "image", dom: "img" },
    { accept: ["video", "videos", "vid"], value: "video", dom: "video" },
    { accept: ["html", "embed"], value: "html", dom: "iframe" },
  ];

  /**
   * Spotlight Context Class. Used for utility methods and fetching promotional media.
   */
  class CS_CONTEXT {
    static _sessionNeedsInit = true;
    static _sessionIndex = null;
    static _globalTags = [];

    /**
     * Normalizes a user-inputted media type.
     *
     * @private
     * @param {String} type Media type to normalize
     * @returns Normalized media type
     */
    static _normalizeMediaType(type) {
      type = type.toLowerCase();
      const item = MEDIA_TYPES.find((m) => m.accept.includes(type));
      return item ?? MEDIA_TYPES[0];
    }

    /**
     * Normalizes a list of tags.
     *
     * @private
     * @param {Array<String>} tagList List of tags
     * @returns Normalized tag list
     */
    static _normalizeTags(tagList) {
      if (!tagList || !Array.isArray(tagList)) return [];
      else return tagList.map((t) => String(t).toLowerCase());
    }

    /**
     * Picks a random item from an array.
     *
     * @private
     * @param {Array<*>} list Array of items to choose from
     * @returns Random item
     */
    static _rngListItem(list) {
      // TODO add random chance multiplier feature here
      if (list.length === 1) return list[0];
      return list[Math.floor(Math.random() * list.length)];
    }

    /**
     * Start the Community Spotlight Session.
     */
    static async startSession() {
      if (!CS_CONTEXT._sessionNeedsInit) return;
      CS_CONTEXT._sessionNeedsInit = false;

      // Cache the current Promotion Index
      const indexURL = HOST_URL + "promotion-index/index.json";
      const response = await fetch(indexURL);
      if (!response.ok) {
        console.error(
          `Couldn't start Community Spotlight Session! (${response.status})`,
        );
        return;
      }

      CS_CONTEXT._sessionIndex = Object.values(await response.json());

      // Append Promotion CSS
      const cssURL = HOST_URL + "promotion-exports/src/cs-promo.css";
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = cssURL;
      document.head.appendChild(css);
    }

    /**
     * Sets the tag list that filters what genres of promotions to display.
     *
     * @param {Array<String>} tags List of Tags
     */
    static setGlobalTags(tags) {
      CS_CONTEXT._globalTags = CS_CONTEXT._normalizeTags(tags);
    }

    /**
     * Gets the tag list that filters what genres of promotions to display.
     *
     * @returns List of Tags
     */
    static getGlobalTags() {
      return CS_CONTEXT._globalTags;
    }

    /**
     * Get a list of Promotions currently in the server.
     *
     * @returns List of Promotions
     */
    static getIndex() {
      return CS_CONTEXT._sessionIndex;
    }

    /**
     * Prepares a raw Promotion by setting up URLs and removing metadata.
     *
     * @param {Object} rawPromo Raw Promotion to cleanse
     * @returns Cleansed Promotion
     */
    static cleansePromo(rawPromo) {
      const promo = {
        id: rawPromo.id,
        tags: rawPromo.tags,
        name: rawPromo["promoter"],
        url: rawPromo["promoter-url"],
        media: HOST_URL + "promotion-media/",
      };

      // Build the media url
      const media = rawPromo.media;
      const type = media.type;

      let fileName = encodeURIComponent(promo.id) + "/";
      if (type === "html" || type === "mp4") {
        fileName += `sz${media.size.replace(":", "x")}`;
        if (type === "mp4") fileName += `leng${media.length}`;
      } else {
        // image route
        fileName += media.size;
      }
      promo.media += `${fileName}.${media.type}`;

      return promo;
    }

    /**
     * Gets a random Promotion.
     *
     * @param {"image"|"video"|"html"} type Promotion Type
     * @param {String} ratio Aspect ratio of Promotion
     * @param {Array<String>} tags List of tags to filter
     * @param {Number} vidLength Requested length of video
     * @returns Cleansed Promotion if one is found, otherwise null
     */
    static getPromo(type, ratio, tags, vidLength = 0) {
      if (!type) type = "image";
      if (!tags) tags = CS_CONTEXT._globalTags;
      const normType = CS_CONTEXT._normalizeMediaType(type).value + "s";

      let index = CS_CONTEXT.getIndex();
      if (tags.length) {
        // Filter by tags
        index = index.filter((p) => p.tags.some((t) => tags.includes(t)));
      }
      if (ratio) {
        // Filter by ratios
        ratio = String(ratio).toLowerCase();
        index.forEach((p) => {
          p.media[normType] = p.media[normType].filter((v) => v.size === ratio);
        });
      }
      if (normType === "videos" && vidLength > 0) {
        // Filter by length
        index.forEach((p) => {
          p.media[normType] = p.media[normType].filter(
            (v) => v.length === vidLength,
          );
        });
      }

      index = index.filter((p) => p.media[normType].length); // Filter by type

      // Normalize Media
      index = structuredClone(index).map((p) => {
        p.media = CS_CONTEXT._rngListItem(p.media[normType]);
        return p;
      });

      const rngRawPromo = CS_CONTEXT._rngListItem(index);
      return rngRawPromo
        ? CS_CONTEXT.cleansePromo(rngRawPromo)
        : null;
    }
  }

  /**
   * Custom element class that displays a Promotion on the DOM.
   * ex: <promo-space type="image" ratio="250x250"></promo-space>
   */
  class PromoSpace extends HTMLElement {
    static _clickWrap(element, func) {
      element.addEventListener("click", (e) => {
        func(e);
        e.stopPropagation();
      });
    }

    static createControlsBar(promo) {
      const OPEN_BTN = `<button class="open" title="See Promoter"><img draggable="false" src="${HOST_URL}assets/eye.svg"/></button>`;
      const CLOSE_BTN = `<button class="close" title="Close"><img draggable="false" src="${HOST_URL}assets/exit.svg"/></button>`;
      const bar = document.createElement("div");

      bar.setAttribute("class", "controls");
      bar.innerHTML = `<div class="controls-inner"><span class="title"></span>${OPEN_BTN}${CLOSE_BTN}</div>`;
      bar.querySelector(".title").textContent = promo.name;
      PromoSpace._clickWrap(bar.querySelector(".open"), () => {
        window.open(promo.url, "_blank");
      });
      PromoSpace._clickWrap(bar.querySelector(".close"), () => {
        bar.parentNode.remove();
      });

      return bar;
    }

    extractMetaData() {
      // Each promo-space element can do its own promotion specifications
      return {
        type: this.getAttribute("type"),
        tags: this.getAttribute("tags"),
        videoLength: this.getAttribute("length"),
        ratio: this.getAttribute("aspect-ratio") ?? this.getAttribute("ratio"),
        width: this.getAttribute("width"),
        height: this.getAttribute("height"),
        hasControls: this.hasAttribute("controls"),
      };
    }

    initGraphic() {
      const metadata = this._metadata;
      const promo = this._promo;
      const domType = metadata.type.dom;
      const hasControls = metadata.hasControls;

      const dom = document.createElement(domType);
      dom.setAttribute("class", "media");
      dom.setAttribute("loading", "lazy");
      dom.setAttribute("src", promo.media);
      if (domType === "img") dom.setAttribute("draggable", false);
      if (domType === "video") dom.setAttribute("controls", "");
      if (domType === "iframe") dom.setAttribute("sandbox", "allow-scripts");

      this.appendChild(dom);
      this.title = promo.name;
      if (metadata.hasControls) {
        this.appendChild(PromoSpace.createControlsBar(promo));
      } else {
        PromoSpace._clickWrap(this, () => window.open(promo.url, "_blank"));
      }
    }

    initElement() {
      try {
        const metadata = this.extractMetaData();
        metadata.videoLength = Number(metadata.videoLength);
        metadata.type = CS_CONTEXT._normalizeMediaType(metadata.type);
        metadata.tags = metadata.tags ? String(metadata.tags).replaceAll(", ", ",").split(",") : null;

        if (metadata.width) this.style.width = metadata.width;
        if (metadata.height) this.style.height = metadata.height;

        this._metadata = metadata;
        this._promo = CS_CONTEXT.getPromo(
          metadata.type.value,
          metadata.ratio,
          metadata.tags,
          metadata.videoLength,
        );

        if (!this._promo) {
          console.warn("Community Spotlight: No Promotion Found!" [this]);
          return;
        }

        this.initGraphic();
      } catch (e) {
        console.warn("Could not initialize Promotion: ", [this], e);
      }
    }

    connectedCallback() {
      if (CS_CONTEXT._sessionNeedsInit) {
        CS_CONTEXT.startSession().then(() => {
          const promoSpaces = Array.from(document.querySelectorAll(DOM_NAME));
          promoSpaces.forEach((s) => s.initElement());
        });
        return;
      } else if (!CS_CONTEXT._sessionIndex) {
        return; // session hasnt fully started yet...
      }

      this.initElement();
    }
  }

  const exports = {
    startSession: CS_CONTEXT.startSession,
    setGlobalTagFilter: CS_CONTEXT.setGlobalTags,
    getGlobalTagFilter: CS_CONTEXT.getGlobalTags,
    getAllPromos: CS_CONTEXT.getIndex,
    randomPromotion: CS_CONTEXT.getPromo,
  };

  window.customElements.define(DOM_NAME, PromoSpace);
  window._communitySpotlight = exports;
  return exports;
})();
