/*
  -= Community Spotlight =-
  By: SharkPool and the Community Spotlight Team
  Developers may Freely use this to Incorporate Promotions in their Projects

  Licence: MIT
  Version: 1.2.0
*/

/* CS Setup (Ignore -- Go to L:83) */
window.CommunitySpotlight = {
  base: "https://raw.githubusercontent.com/Community-Spotlight/",
  utils: {}, cache: {}
};

window.CommunitySpotlight.utils["fetchIndex"] = async function () {
  const baseURL = window.CommunitySpotlight.base;
  const response = await fetch(`${baseURL}promotion-index/main/index.json`);
  if (!response.ok) throw new Error("Couldn't fetch promotions!");
  return await response.json();
}
window.CommunitySpotlight.utils["filterPromos"] = function (json, type, optParams) {
  const rngItem = (array) => array[Math.floor(Math.random() * array.length)];
  type = type === "video" ? "video" : type === "html" ? "html" : "image";
  optParams = typeof optParams === "object" ? optParams : {};
  if (optParams.tags) {
    if (optParams.tags.constructor.name === "Array") optParams.tags = optParams.tags.map((e) => { return e.toLowerCase() });
    else {
      console.warn("CS -- 'tags' parameter must be an Array");
      return {};
    }
  }
  const { aspectRatio, videoLength } = optParams;

  let promos = Object.values(json).filter(promo => { return promo.media[type + "s"].length > 0 });
  if (promos.length === 0) {
    console.warn("CS -- No promotions found with given type");
    return {};
  }

  if (optParams.tags && optParams.tags.length > 0) {
    promos = promos.filter((promo) => promo.tags.some(tag => optParams.tags.includes(tag)));
  }
  if (aspectRatio) promos = promos.filter(promo => {
    return promo.media[type + "s"].some((i) => { return i.size === aspectRatio });
  });
  if (type === "video" && videoLength) promos = promos.filter(promo => {
    return promo.media.videos.some((i) => { return i.length === videoLength });
  });
  if (promos.length === 0) {
    console.warn("CS -- No promotions found with given parameters");
    return {};
  }

  const returner = rngItem(promos);
  let media, path, files;
  switch (type) {
    case "video":
      files = returner.media.videos;
      if (aspectRatio && videoLength) media = files.find(i => (i.size === aspectRatio && i.length === videoLength));
      else if (!aspectRatio && videoLength) media = files.find(i => (i.length === videoLength));
      else if (aspectRatio && !videoLength) media = files.find(i => (i.size === aspectRatio));
      else media = rngItem(files);
      path = `sz${media.size.replace(":", "x")}leng${media.length}.${media.type}`;
      break;
    case "html":
      files = returner.media.htmls;
      if (aspectRatio) media = files.find(i => (i.size === aspectRatio));
      else media = rngItem(files);
      path = `sz${media.size.replace(":", "x")}.html`;
      break;
    default:
      files = returner.media.images;
      if (aspectRatio) media = files.find(i => (i.size === aspectRatio));
      else media = rngItem(files);
      path = `${media.size}.${media.type}`;
  }
  delete returner.media;
  returner.url = `${base}promotion-media/main/${encodeURIComponent(returner.id)}/${path}`;
  return returner;
}

/* Your Functions */
// fetches and saves all Promotions to the cache (optional)
async function refreshPromoCacheCS() {
  try {
    window.CommunitySpotlight.cache = await window.CommunitySpotlight.utils["fetchIndex"]();
  } catch (e) {
    console.error(e);
  }
}

// returns JSON with Info and the URL to a random Promotion based on given Optional Parameters
// use "getCachedPromoCS" if you're relying on the cache system ("refreshPromoCacheCS")
/*
  PARAMETERS

  type: "image" or "video" or "html"
  optParams: {
    tags: [array] (valid Tags listed in our Uploader Site)
    aspectRatio: (image) 250x250, 300x250, 480x270, 300x50, 50x300, 360x120, or 120x360
    aspectRatio: (video) 1:1, 4:3, 4:5, 16:9, or 9:16
    videoLength: (video) 5, 10, 15, or 30
    aspectRatio: (html) 1:1, 4:3, 4:5, 16:9, or 9:16
  }
*/
async function getOnlinePromoCS(type, optParams) {
  const promoList = await window.CommunitySpotlight.utils["fetchIndex"]();
  return window.CommunitySpotlight.utils["filterPromos"](promoList, type, optParams);
}
function getCachedPromoCS(type, optParams) {
  return window.CommunitySpotlight.utils["filterPromos"](
    structuredClone(window.CommunitySpotlight.cache), type, optParams
  );
}
