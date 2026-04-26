"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimeKaiScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const ANIMEKAI_BASE = 'https://anikai.to';
const ANIMEKAI_HOME_BASE = 'https://animekai.to';
const ENC_DEC_BASE = 'https://enc-dec.app/api';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
class AnimeKaiScraper {
    async close() { }
    getWatchReferer(animeSession) {
        return `${ANIMEKAI_BASE}/watch/${animeSession}`;
    }
    extractBackgroundImage(input) {
        const match = String(input || '').match(/url\((['"]?)(.*?)\1\)/i);
        const value = String(match?.[2] || '').trim();
        return value || undefined;
    }
    normalizeGenreSlug(value) {
        return String(value || '')
            .trim()
            .replace(/^https?:\/\/[^/]+/i, '')
            .replace(/^\/?genres\//i, '')
            .replace(/[_\s]+/g, '-')
            .replace(/[^a-z0-9-]/gi, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase();
    }
    parseGenreItems($) {
        const seen = new Set();
        const items = [];
        $('.nav-menu a[href^="/genres/"]').each((_, element) => {
            const $el = $(element);
            const name = String($el.text() || '').trim();
            const slug = this.normalizeGenreSlug(String($el.attr('href') || '').trim());
            if (!name || !slug || seen.has(slug))
                return;
            seen.add(slug);
            items.push({ name, slug });
        });
        return items;
    }
    collectListItems($, selectors) {
        const seen = new Set();
        const items = [];
        for (const selector of selectors) {
            $(selector).each((_, element) => {
                const item = this.parseLatestUpdateCard($, element);
                if (!item || seen.has(item.scraperId))
                    return;
                seen.add(item.scraperId);
                items.push(item);
            });
            if (items.length > 0) {
                return items;
            }
        }
        return items;
    }
    parseLatestUpdateCard($, element) {
        const $el = $(element);
        const posterLink = String($el.find('a.poster').attr('href') || '').trim();
        const titleEl = $el.find('a.title').first();
        const title = String(titleEl.attr('title') || titleEl.text() || '').trim();
        const jname = String(titleEl.attr('data-jp') || '').trim();
        const poster = String($el.find('img').attr('data-src') || $el.find('img').attr('src') || '').trim();
        const infoSpans = $el.find('.info span');
        const sub = Number(String(infoSpans.eq(0).text() || '').replace(/\D/g, '')) || 0;
        const dub = Number(String(infoSpans.eq(1).text() || '').replace(/\D/g, '')) || 0;
        const numericThird = Number(String(infoSpans.eq(2).text() || '').replace(/\D/g, '')) || 0;
        const episodes = numericThird || undefined;
        const type = String(infoSpans.last().text() || '').trim() || undefined;
        const watchPath = posterLink.split('#')[0].trim();
        const scraperId = watchPath.replace(/^\/watch\//, '').trim();
        if (!title || !watchPath || !scraperId)
            return null;
        return {
            title,
            jname: jname || undefined,
            poster: poster || undefined,
            type,
            episodes,
            latestEpisode: Math.max(sub, dub, numericThird) || undefined,
            sub: sub || undefined,
            dub: dub || undefined,
            link: `${ANIMEKAI_HOME_BASE}${posterLink}`,
            scraperId,
        };
    }
    parsePagination($, currentPage) {
        const pageLinks = $('.pagination a.page-link')
            .map((_, element) => {
            const href = String($(element).attr('href') || '');
            const match = href.match(/page=(\d+)/i);
            return match ? Number(match[1]) : null;
        })
            .get()
            .filter((value) => Number.isFinite(value) && Number(value) > 0);
        const lastPage = pageLinks.length > 0 ? Math.max(...pageLinks) : currentPage;
        const hasNextPage = $('.pagination a.page-link[rel="next"]').length > 0 || currentPage < lastPage;
        return {
            current_page: currentPage,
            last_visible_page: lastPage,
            has_next_page: hasNextPage,
        };
    }
    async getSpotlightAnime() {
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_HOME_BASE}/home`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_HOME_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const items = [];
            $('#featured .swiper-slide').each((_, element) => {
                const $el = $(element);
                const detail = $el.find('.detail').first();
                const titleEl = detail.find('.title').first();
                const title = String(titleEl.text() || '').trim();
                const href = String(detail.find('a.watch-btn').attr('href') || '').trim();
                const scraperId = href.replace(/^\/watch\//, '').trim();
                if (!title || !href || !scraperId)
                    return;
                const infoSpans = detail.find('.info > span');
                const sub = Number(String(infoSpans.filter('.sub').first().text() || '').replace(/\D/g, '')) || 0;
                const dub = Number(String(infoSpans.filter('.dub').first().text() || '').replace(/\D/g, '')) || 0;
                const type = String(infoSpans.find('b').first().text() || '').trim() || undefined;
                const genres = String(infoSpans
                    .filter((__, span) => {
                    const $span = $(span);
                    return !$span.hasClass('sub') && !$span.hasClass('dub') && $span.find('b').length === 0;
                })
                    .last()
                    .text() || '').trim() || undefined;
                const metadata = new Map();
                detail.find('.mics > div').each((__, metaEl) => {
                    const key = String($(metaEl).find('div').first().text() || '').trim().toLowerCase();
                    const value = String($(metaEl).find('span').first().text() || '').trim();
                    if (key && value) {
                        metadata.set(key, value);
                    }
                });
                items.push({
                    title,
                    jname: String(titleEl.attr('data-jp') || '').trim() || undefined,
                    banner: this.extractBackgroundImage(String($el.attr('style') || '').trim()),
                    description: String(detail.find('.desc').text() || '').trim() || undefined,
                    quality: metadata.get('quality'),
                    rating: metadata.get('rating'),
                    year: metadata.get('release'),
                    type,
                    genres,
                    latestEpisode: Math.max(sub, dub) || undefined,
                    sub: sub || undefined,
                    dub: dub || undefined,
                    link: `${ANIMEKAI_HOME_BASE}${href}`,
                    scraperId,
                });
            });
            return items;
        }
        catch (error) {
            console.error('AnimeKai spotlight error:', error);
            return [];
        }
    }
    async getLatestUpdates() {
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_HOME_BASE}/home`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_HOME_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const items = [];
            $('#latest-updates .aitem').each((_, element) => {
                const item = this.parseLatestUpdateCard($, element);
                if (item)
                    items.push(item);
            });
            return items;
        }
        catch (error) {
            console.error('AnimeKai latest updates error:', error);
            return [];
        }
    }
    async getNewReleases(page = 1, limit = 18) {
        try {
            const safePage = Math.max(1, Number(page) || 1);
            const safeLimit = Math.max(1, Number(limit) || 18);
            const { data } = await axios_1.default.get(`${ANIMEKAI_HOME_BASE}/new-releases?page=${safePage}`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_HOME_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const parsed = [];
            $('.aitem-wrapper .aitem').each((_, element) => {
                const item = this.parseLatestUpdateCard($, element);
                if (item)
                    parsed.push(item);
            });
            const dataSlice = parsed.slice(0, safeLimit);
            return {
                data: dataSlice,
                pagination: this.parsePagination($, safePage),
            };
        }
        catch (error) {
            console.error('AnimeKai new releases error:', error);
            return {
                data: [],
                pagination: {
                    current_page: Math.max(1, Number(page) || 1),
                    last_visible_page: Math.max(1, Number(page) || 1),
                    has_next_page: false,
                },
            };
        }
    }
    async getTopTrending(range) {
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_HOME_BASE}/home`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_HOME_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const tabId = range === 'now' ? 'trending' : range;
            const items = [];
            $(`#trending-anime .tab-body[data-id="${tabId}"] > a.aitem`).each((_, element) => {
                const $el = $(element);
                const href = String($el.attr('href') || '').trim();
                const scraperId = href.replace(/^\/watch\//, '').trim();
                const titleEl = $el.find('.detail .title').first();
                const title = String(titleEl.text() || '').trim();
                const jname = String(titleEl.attr('data-jp') || '').trim();
                const poster = this.extractBackgroundImage(String($el.attr('style') || '').trim());
                const infoSpans = $el.find('.detail .info > span');
                const sub = Number(String(infoSpans.filter('.sub').first().text() || '').replace(/\D/g, '')) || 0;
                const dub = Number(String(infoSpans.filter('.dub').first().text() || '').replace(/\D/g, '')) || 0;
                const type = String(infoSpans.last().text() || '').trim() || undefined;
                if (!title || !href || !scraperId)
                    return;
                items.push({
                    title,
                    jname: jname || undefined,
                    poster,
                    type,
                    latestEpisode: Math.max(sub, dub) || undefined,
                    sub: sub || undefined,
                    dub: dub || undefined,
                    link: `${ANIMEKAI_HOME_BASE}${href}`,
                    scraperId,
                });
            });
            return items;
        }
        catch (error) {
            console.error(`AnimeKai top trending error (${range}):`, error);
            return [];
        }
    }
    async getAZList(letter, page = 1) {
        const safePage = Math.max(1, Number(page) || 1);
        const rawLetter = String(letter || 'All').trim();
        const normalizedLetter = rawLetter.toLowerCase() === 'all'
            ? ''
            : (rawLetter === '#' ? '0-9' : rawLetter.toUpperCase());
        const path = normalizedLetter ? `/az-list/${encodeURIComponent(normalizedLetter)}` : '/az-list';
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_HOME_BASE}${path}?page=${safePage}`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_HOME_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const items = this.collectListItems($, ['.aitem-wrapper .aitem', '.aitem']);
            return {
                data: items,
                pagination: this.parsePagination($, safePage),
            };
        }
        catch (error) {
            console.error(`AnimeKai A-Z list error (${rawLetter}, page=${safePage}):`, error);
            return {
                data: [],
                pagination: {
                    current_page: safePage,
                    last_visible_page: safePage,
                    has_next_page: false,
                },
            };
        }
    }
    async getGenres() {
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_HOME_BASE}/home`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_HOME_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            return this.parseGenreItems($);
        }
        catch (error) {
            console.error('AnimeKai genres error:', error);
            return [];
        }
    }
    async getGenreAnime(genre, page = 1, limit = 24) {
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.max(1, Number(limit) || 24);
        const rawGenre = String(genre || '').trim();
        const slug = this.normalizeGenreSlug(rawGenre);
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_HOME_BASE}/genres/${encodeURIComponent(slug)}?page=${safePage}`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_HOME_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const items = this.collectListItems($, ['.aitem-wrapper .aitem', '.aitem']).slice(0, safeLimit);
            const genreName = String($('.shead .stitle').first().text() || '')
                .replace(/\s+Anime$/i, '')
                .trim() || rawGenre || slug;
            return {
                genre: {
                    name: genreName,
                    slug,
                },
                data: items,
                pagination: this.parsePagination($, safePage),
            };
        }
        catch (error) {
            console.error(`AnimeKai genre page error (${rawGenre}, page=${safePage}):`, error);
            return {
                genre: {
                    name: rawGenre || slug,
                    slug,
                },
                data: [],
                pagination: {
                    current_page: safePage,
                    last_visible_page: safePage,
                    has_next_page: false,
                },
            };
        }
    }
    parseEpisodeToken(episodeSession) {
        const match = String(episodeSession || '').match(/\$token=([^$]+)/);
        return match?.[1] ? decodeURIComponent(match[1]) : '';
    }
    async encKai(text) {
        const { data } = await axios_1.default.get(`${ENC_DEC_BASE}/enc-kai`, {
            params: { text },
            timeout: 15000,
            proxy: false,
            headers: {
                'User-Agent': BROWSER_UA,
                Accept: 'application/json, text/plain, */*',
            },
        });
        if (!data?.result) {
            throw new Error('enc-kai returned no result');
        }
        return String(data.result);
    }
    async decKai(text) {
        const { data } = await axios_1.default.post(`${ENC_DEC_BASE}/dec-kai`, { text }, {
            timeout: 15000,
            proxy: false,
            headers: {
                'User-Agent': BROWSER_UA,
                'Content-Type': 'application/json',
                Accept: 'application/json, text/plain, */*',
            },
        });
        if (!data?.result || typeof data.result !== 'object') {
            throw new Error(`dec-kai returned invalid payload: ${JSON.stringify(data)}`);
        }
        return data.result;
    }
    async decMega(text) {
        const { data } = await axios_1.default.post(`${ENC_DEC_BASE}/dec-mega`, {
            text,
            agent: BROWSER_UA,
        }, {
            timeout: 15000,
            proxy: false,
            headers: {
                'User-Agent': BROWSER_UA,
                'Content-Type': 'application/json',
                Accept: 'application/json, text/plain, */*',
            },
        });
        if (!data?.result || !Array.isArray(data.result.sources)) {
            throw new Error(`dec-mega returned invalid payload: ${JSON.stringify(data)}`);
        }
        return data.result;
    }
    async resolveEmbedUrl(animeSession, episodeSession) {
        const token = this.parseEpisodeToken(episodeSession);
        if (!token) {
            throw new Error(`Invalid AnimeKai episode session: ${episodeSession}`);
        }
        const referer = this.getWatchReferer(animeSession);
        const listKey = await this.encKai(token);
        const { data: listPayload } = await axios_1.default.get(`${ANIMEKAI_BASE}/ajax/links/list`, {
            params: { token, _: listKey },
            timeout: 15000,
            proxy: false,
            headers: {
                'User-Agent': BROWSER_UA,
                'X-Requested-With': 'XMLHttpRequest',
                Referer: referer,
                Accept: 'application/json, text/plain, */*',
            },
        });
        const html = String(listPayload?.result || '');
        if (!html) {
            throw new Error('AnimeKai links/list returned empty HTML');
        }
        const $ = cheerio.load(html);
        const server = $('.server-items[data-id="sub"] .server').first() ||
            $('.server-items[data-id="softsub"] .server').first() ||
            $('.server').first();
        const lid = String(server.attr('data-lid') || '').trim();
        if (!lid) {
            throw new Error('AnimeKai links/list returned no server lid');
        }
        const viewKey = await this.encKai(lid);
        const { data: viewPayload } = await axios_1.default.get(`${ANIMEKAI_BASE}/ajax/links/view`, {
            params: { id: lid, _: viewKey },
            timeout: 15000,
            proxy: false,
            headers: {
                'User-Agent': BROWSER_UA,
                'X-Requested-With': 'XMLHttpRequest',
                Referer: referer,
                Accept: 'application/json, text/plain, */*',
            },
        });
        const decrypted = await this.decKai(String(viewPayload?.result || ''));
        const embedUrl = String(decrypted?.url || '').trim();
        if (!embedUrl) {
            throw new Error('AnimeKai links/view returned no embed URL');
        }
        return embedUrl;
    }
    async fetchLinksManual(animeSession, episodeSession) {
        const referer = await this.resolveEmbedUrl(animeSession, episodeSession);
        const mediaUrl = referer.replace('/e/', '/media/');
        const { data: mediaPayload } = await axios_1.default.get(mediaUrl, {
            timeout: 15000,
            proxy: false,
            headers: {
                'User-Agent': BROWSER_UA,
                Accept: 'application/json, text/plain, */*',
            },
        });
        const encrypted = String(mediaPayload?.result || '').trim();
        if (!encrypted) {
            throw new Error('MegaUp media returned no encrypted result');
        }
        const decrypted = await this.decMega(encrypted);
        const subtitles = Array.isArray(decrypted?.tracks)
            ? decrypted.tracks
                .filter((sub) => sub?.file)
                .map((sub) => ({
                url: `/api/scraper/proxy?url=${encodeURIComponent(String(sub.file))}&referer=${encodeURIComponent(referer)}`,
                lang: String(sub.label || sub.lang || 'Unknown'),
                default: Boolean(sub.default),
            }))
            : [];
        return (Array.isArray(decrypted?.sources) ? decrypted.sources : [])
            .filter((source) => source?.file)
            .map((source) => {
            const directUrl = String(source.file);
            const isHls = directUrl.includes('.m3u8');
            return {
                quality: '1080',
                audio: 'sub',
                provider: 'animekai',
                server: 'animekai',
                url: isHls
                    ? `/api/scraper/proxy?url=${encodeURIComponent(directUrl)}&referer=${encodeURIComponent(referer)}`
                    : directUrl,
                directUrl,
                isHls,
                subtitles,
            };
        });
    }
    async search(query) {
        const normalizedQuery = String(query || '').replace(/\s+/g, ' ').trim();
        if (!normalizedQuery)
            return [];
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_HOME_BASE}/browser`, {
                params: { keyword: normalizedQuery },
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_HOME_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const items = this.collectListItems($, ['.aitem', '.film_list-wrap .flw-item']);
            return items.map((item) => ({
                id: item.scraperId,
                session: item.scraperId,
                title: item.title,
                url: `/watch/${item.scraperId}`,
                poster: item.poster,
                type: item.type,
                episodes: item.episodes,
                sub: item.sub,
                dub: item.dub,
            }));
        }
        catch (error) {
            console.error('AnimeKai search error:', error);
            return [];
        }
    }
    async getAnimeInfo(animeSessionId) {
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_BASE}/watch/${animeSessionId}`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const episodes = Number($('.entity-scroll > .detail').find("div:contains('Episodes') > span").text().trim()) || 0;
            const premiered = $('.entity-scroll > .detail').find("div:contains('Premiered') > span").text().trim();
            const yearMatch = premiered.match(/(\d{4})/);
            return {
                id: animeSessionId,
                title: String($('.entity-scroll > .title').text() || animeSessionId).trim(),
                poster: String($('div.poster > div > img').attr('src') || '').trim() || undefined,
                description: String($('.entity-scroll > .desc').text() || '').trim() || undefined,
                status: String($('.entity-scroll > .detail').find("div:contains('Status') > span").text() || '').trim() || undefined,
                episodes: episodes || undefined,
                type: String($('.entity-scroll > .info').children().last().text() || '').trim().toUpperCase() || undefined,
                year: yearMatch?.[1],
            };
        }
        catch (error) {
            console.error('AnimeKai getAnimeInfo error:', error);
            return null;
        }
    }
    async getEpisodes(animeSessionId) {
        try {
            const { data } = await axios_1.default.get(`${ANIMEKAI_BASE}/watch/${animeSessionId}`, {
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    Referer: `${ANIMEKAI_BASE}/`,
                },
            });
            const $ = cheerio.load(data);
            const aniId = String($('.rate-box#anime-rating').attr('data-id') || '').trim();
            if (!aniId) {
                return { episodes: [], lastPage: 1 };
            }
            const token = await this.encKai(aniId);
            const { data: episodesAjax } = await axios_1.default.get(`${ANIMEKAI_BASE}/ajax/episodes/list`, {
                params: { ani_id: aniId, _: token },
                timeout: 20000,
                proxy: false,
                headers: {
                    'User-Agent': BROWSER_UA,
                    'X-Requested-With': 'XMLHttpRequest',
                    Referer: `${ANIMEKAI_BASE}/watch/${animeSessionId}`,
                    Accept: 'application/json, text/plain, */*',
                },
            });
            const $$ = cheerio.load(String(episodesAjax?.result || ''));
            const maxSub = Number($('.entity-scroll > .info > span.sub').text().trim()) || 0;
            const maxDub = Number($('.entity-scroll > .info > span.dub').text().trim()) || 0;
            const episodes = [];
            $$('div.eplist > ul > li > a').each((_, el) => {
                const num = Number($$(el).attr('num') || 0);
                const epToken = String($$(el).attr('token') || '').trim();
                if (!num || !epToken)
                    return;
                const href = String($$(el).attr('href') || '').trim();
                episodes.push({
                    id: `${animeSessionId}$ep=${num}$token=${epToken}`,
                    session: `${animeSessionId}$ep=${num}$token=${epToken}`,
                    episodeNumber: num,
                    url: `${ANIMEKAI_BASE}/watch/${animeSessionId}${href}ep=${num}`,
                    title: String($$(el).children('span').text() || `Episode ${num}`).trim(),
                    isSubbed: num <= maxSub,
                    isDubbed: num <= maxDub,
                    isFiller: $$(el).hasClass('filler'),
                });
            });
            return { episodes, lastPage: 1 };
        }
        catch (error) {
            console.error('AnimeKai getEpisodes error:', error);
            return { episodes: [], lastPage: 1 };
        }
    }
    async getLinks(animeSession, episodeSession) {
        try {
            const manual = await this.fetchLinksManual(animeSession, episodeSession);
            if (manual.length > 0) {
                return manual;
            }
        }
        catch (error) {
            console.error('AnimeKai getLinks manual path failed:', {
                animeSession,
                episodeSession,
                error: error instanceof Error ? error.message : error,
            });
        }
        return [];
    }
}
exports.AnimeKaiScraper = AnimeKaiScraper;
