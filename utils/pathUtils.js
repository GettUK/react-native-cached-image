import { isArray, pick, toLower, toPairs, sortBy, map } from 'lodash';
import URL from 'url-parse';
import SHA1 from 'crypto-js/sha1';

const defaultImageTypes = ['png', 'jpeg', 'jpg', 'gif', 'bmp', 'tiff', 'tif'];

function serializeObjectKeys(obj) {
    return map(sortBy(toPairs(obj), a => a[0]), a[1])
}

function getQueryForCacheKey(url, useQueryParamsInCacheKey) {
    if (isArray(useQueryParamsInCacheKey)) {
        return serializeObjectKeys(pick(url.query, useQueryParamsInCacheKey));
    }
    if (useQueryParamsInCacheKey) {
        return serializeObjectKeys(url.query);
    }
    return '';
}

function generateCacheKey(url, useQueryParamsInCacheKey = true) {
    const parsedUrl = new URL(url, null, true);

    const pathParts = parsedUrl.pathname.split('/');

    // last path part is the file name
    const fileName = pathParts.pop();
    const filePath = pathParts.join('/');

    const parts = fileName.split('.');
    const fileType = parts.length > 1 ? toLower(parts.pop()) : '';
    const type = defaultImageTypes.includes(fileType) ? fileType : 'jpg';

    const cacheable = filePath + fileName + type + getQueryForCacheKey(parsedUrl, useQueryParamsInCacheKey);
    return SHA1(cacheable) + '.' + type;
}

function getHostCachePathComponent(url) {
    const {
        host
    } = new URL(url);

    return host.replace(/\.:/gi, '_').replace(/[^a-z0-9_]/gi, '_').toLowerCase()
      + '_' + SHA1(host);
}

/**
 * handle the resolution of URLs to local file paths
 */
export default {

    /**
     * Given a URL and some options returns the file path in the file system corresponding to it's cached image location
     * @param url
     * @param cacheLocation
     * @returns {string}
     */
    getImageFilePath(url, cacheLocation) {
        const hostCachePath = getHostCachePathComponent(url);
        const cacheKey = generateCacheKey(url);

        return `${cacheLocation}/${hostCachePath}/${cacheKey}`;
    },

    /**
     * Given a URL returns the relative file path combined from host and url hash
     * @param url
     * @returns {string}
     */

    getImageRelativeFilePath(url) {
        const hostCachePath = getHostCachePathComponent(url);
        const cacheKey = generateCacheKey(url);

        return `${hostCachePath}/${cacheKey}`;
    },


    /**
     * returns the url after removing all unused query params
     * @param url
     * @param useQueryParamsInCacheKey
     * @returns {string}
     */
    getCacheableUrl(url, useQueryParamsInCacheKey) {
        const parsedUrl = new URL(url, null, true);
        if (isArray(useQueryParamsInCacheKey)) {
            parsedUrl.set('query', pick(parsedUrl.query, useQueryParamsInCacheKey));
        }
        if (!useQueryParamsInCacheKey) {
            parsedUrl.set('query', {});
        }
        return parsedUrl.toString();
    }

};
