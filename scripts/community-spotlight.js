/*
  -= Community Spotlight =-
  By: SharkPool and the Community Spotlight Team
  Developers may Freely use this to Incorporate Promotions in their Projects

  Licence: MIT
  Version: 1.0.1
*/

window.CSPromos = {}; // CS Storage
const base = "https://raw.githubusercontent.com/Community-Spotlight/";

// Fetches and Saves all Promotions to the Window
// Run this Function before using any other Function
async function refreshPromos() {
  try {
    const response = await fetch(`${base}promotion-index/main/index.json`);
    if (!response.ok) throw new Error("Couldn't fetch promotions!");
    window.CSPromos = await response.json();
  } catch (e) { console.error(e) }
}

// Returns a JSON with Info and the URL to a random Promotion based on given Parameters
// Each Parameter is Optional
/*
  type: "image" or "video"
  optParams: {
    tags: [array]
    aspectRatio: (image) 250x250, 300x250, 480x270, 300x50, 50x300, 360x120, or 120x360
    aspectRatio: (video) 1:1, 4:3, 4:5, 16:9, or 9:16
    videoLength: (video) 5, 10, 15, or 30
  }
*/
function getPromotion(type, optParams) {
  const randItem = (array) => array[Math.floor(Math.random() * array.length)];
  type = type === "video" ? "video" : "image";
  optParams = typeof optParams === "object" ? optParams : {};
  let json = window.CSPromos;

  if (optParams.tags && optParams.tags.length > 0) {
    json = Object.fromEntries(
      Object.entries(json).filter(([_, promo]) => promo.tags.some(tag => optParams.tags.includes(tag.toLowerCase())))
    );
  }
  const keys = Object.keys(json).filter(id => {
    const promo = json[id];
    if (type === "image") return Object.keys(promo.media.images).length > 0;
    else if (type === "video") return promo.media.videos.length > 0;
    return false;
  });
  if (keys.length === 0) {
    console.warn("CS -- No promotions found for the given parameters");
    return {};
  }
  let promo, path, tries = 0;
  while (tries < keys.length) {
    const id = randItem(keys);
    promo = json[id];
    const media = promo.media;
    if (type === "image") {
      const sizes = Object.keys(media.images);
      const aspectRatio = optParams.aspectRatio || randItem(sizes);
      path = sizes.includes(aspectRatio) ? aspectRatio : null;
      path = path ? `${path}.${media.images[path].type.toLowerCase()}` : null;
    } else if (type === "video") {
      const videos = media.videos;
      let video = videos.find(v => 
        (!optParams.aspectRatio || v.size === optParams.aspectRatio) && 
        (!optParams.videoLength || v.length === optParams.videoLength)
      );
      path = video ? `sz${video.size.replace(":", "x")}leng${video.length}.${video.type.toLowerCase()}` : null;
    }
    if (path) break;
    tries++;
  }
  if (!path) {
    console.warn("CS -- No promotions found for the given parameters");
    return {};
  }
  const returner = { ...promo };
  delete returner.media;
  return {
    ...returner, url: `${base}promotion-media/main/${type}/${returner.id}/${path}`
  };
}
