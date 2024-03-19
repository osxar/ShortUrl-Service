import seedrandom from 'seedrandom';
import config from '../../config.js';
import Counter from '../models/Counter.js';
import Links from '../models/Links.js';
import Activities from '../models/Activities.js';
import cache from '../util/node.cache.js';


const ELEMENTS = config.elements;
const TOTAL_TRIAL = config.totalTrial;
const CACHE_PREFIX = config.cachePrefix;
const URL_LENGTH = config.urlLength;
const nodeCache = cache;

const generateUrl = async (req, res, next) => {
    const longUrl = req.body.url;

    // Validate url
    if(!isValidUrl(longUrl)){
        return res.status(500).json({
            message: `Provided Url is not valid ${longUrl}`,
        });
    }

    try {
        const count = await Counter.findOne();

        let shortUrl;
        let linkIsPresent = true;
        let seed = count.counter;
        let trials = 0;

        while(linkIsPresent && trials!=TOTAL_TRIAL){
            seed+=1;
            
            shortUrl = `${req.protocol}://${req.get('host')}/${base10ToBase62(seed)}`;
            const exsistingLink = await Links.findOne({ shortUrl });

            linkIsPresent = !!exsistingLink;
            trials+=1;
        }

        if(linkIsPresent){
            return res.status(500).json({
                message: `ShortUrl could not be generated after ${TOTAL_TRIAL} trials`,
            });
        }

        const newLink = await Links.create({
            longUrl: longUrl,
            shortUrl: shortUrl,
            counterNumber: seed
        });

        await Counter.updateOne(
            { _id: count._id },
            { $set: { counter: seed } }
        );

        // Store the activities record in the cache
        nodeCache.set(`${CACHE_PREFIX}_${shortUrl}`, {longUrl: longUrl, urlId: newLink.id});

        return res.status(200).json({
            status: 200,
            data: {
                longUrl,
                shortUrl,
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal Server Error',   
        });
    }
}

const redirectUrl = async (req, res, next) => {
    const startTime = Date.now(); // Record the start time

    let {shortUrl} = req.params;

    shortUrl = `${req.protocol}://${req.get('host')}/${shortUrl}`;

    try {
        // Check if the result is in the cache
        const cacheKey = `${CACHE_PREFIX}_${shortUrl}`;
        let cacheResult =  nodeCache.get(cacheKey);

        if(!cacheResult){

            const links = await Links.findOne({shortUrl:shortUrl});

            if(!links){
                return res.status(500).json({
                    message: `Short Url - ${shortUrl} doese not have a corresponding long Url`
                });
            }

            // Store the activities record in the cache
            nodeCache.set(`${CACHE_PREFIX}_${shortUrl}`, {longUrl: links.longUrl, urlId: links.id});  

            const endTime = Date.now(); // Record the end time
            const timeTaken = endTime - startTime; // Calculate the time taken in milliseconds

            // Handle Activity record creation Asynchroniously
            setTimeout(() => {
                try {
                    findOrCreateActivitiesRecord(links.id, timeTaken);
                } catch (error) {
                    console.log(error);
                }
            }, 1);

            return res.redirect(`${links.longUrl}`);

        }

        const endTime = Date.now(); // Record the end time
        const timeTaken = endTime - startTime; // Calculate the time taken in milliseconds

        // Handle record creation Asynchroniously
        setTimeout(() => {
            try {
                findOrCreateActivitiesRecord(cacheResult.urlId, timeTaken);
            } catch (error) {
                console.log(error);
            }
        }, 1);

        return res.redirect(`${cacheResult.longUrl}`);
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal Server Error',   
        });
    }
}

const urlAnalytics = async (req, res, next) => {

    let {shortUrl} = req.params;
    shortUrl = `${req.protocol}://${req.get('host')}/${shortUrl}`;

    try {
        const links = await Links.findOne({shortUrl:shortUrl});

        if(!links){
            return res.status(500).json({
                message: `Analytics not available for Short Url - ${shortUrl}. No corresponding long Url`
            });
        }

        const payload = await getAnalytics(links.id);

        return res.status(200).json({
            status: 200,
            data: payload
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal Server Error',   
        });
    }
}

const allUrls = async (req, res, next) => {
    // Note this method should be modified to return a paginated response if the records are long

    try {
        const allLinks = await Links.find({})

        const payload = await Promise.all(allLinks.map(async (link)=>{
            return {
                shortUrl: link.shortUrl,
                longUrl: link.longUrl,
                analytics: await getAnalytics(link.id)
            }
        }));

        return res.status(200).json({
            status: 200,
            data: payload
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Internal Server Error',   
        });
    }
}

const base10ToBase62 = (seed) => {
    const randomGenerator = seedrandom(seed.toString());
    let url = '';

    for (let i = 0; i < URL_LENGTH; i++){
        url += ELEMENTS.charAt(Math.floor(randomGenerator() * ELEMENTS.length));
    }

    return url;
}

const findOrCreateActivitiesRecord = (linksRefId, timeDelta) => {
    Activities.create({
        url: linksRefId,
        requestTime: timeDelta,
        createdUtc: new Date(),
    }).then(activitiesRecord => {
        console.log('Activities record:', activitiesRecord);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

const getActivitiesWithinDurationInMs = async (urlId, durationInMs) => {
    if(durationInMs){
        const duration = new Date(Date.now() - durationInMs);
        const activities = await Activities.find({
            url: urlId,
            createdUtc: { $gte: duration }
        });
        return activities
    }
    const activities = await Activities.find({ url: urlId });
    return activities;
};



const getAnalytics  = async (urlId)=>{
    const oneDay = await getActivitiesWithinDurationInMs(urlId, 24 * 60 * 60 * 1000);
    const oneWeek = await getActivitiesWithinDurationInMs(urlId, 7 * 24 * 60 * 60 * 1000);
    const allTime = await getActivitiesWithinDurationInMs(urlId);

    const reducer = (accumulator, currentValue) => accumulator + currentValue.requestTime;
    const initialValue = 0;

    const payload = {
        oneday: {
            count: oneDay.length,
            averageRequestTime: oneDay.length != 0 ? oneDay.reduce(reducer, initialValue)/oneDay.length : 0
        },
        oneWeek: {
            count: oneWeek.length,
            averageRequestTime: oneWeek.length != 0 ? oneWeek.reduce(reducer, initialValue)/oneWeek.length : 0
        },
        allTime: {
            count: allTime.length,
            averageRequestTime: allTime.length != 0 ? allTime.reduce(reducer, initialValue)/allTime.length : 0
        }
    }

    return payload;
}

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

export default {
    generateUrl,
    redirectUrl,
    urlAnalytics,
    allUrls
};
