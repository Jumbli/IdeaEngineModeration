module.exports = async function (context, req)
{
    const sentimentUrl = "analyze/standard/en/sentiment";
    const emotionalTraitsUrl = "categorize/emotional-traits/en?features=extradata";
    const piiUrl = "detect/pii/en";
    const hateSpeachUrl = "detect/hate-speech/en";

    var status='OK';
    var sentimentResponse="";
    var emotionalTraitsResponse="";
    var hateSpeachResponseExtractions="";
    var hateSpeachResponseCategories="";
    var piiResponse="";

    var response="";
    var token = await GetToken(context);

    response = await AnalyseDocument(context,token,req.body.document, sentimentUrl);
    sentimentResponse = response.data.data.sentiment.overall;
    
    var response = await AnalyseDocument(context,token,req.body.document, emotionalTraitsUrl);
    emotionalTraitsResponse = response.data.data.extraData;

    var response = await AnalyseDocument(context,token,req.body.document, hateSpeachUrl);
    hateSpeachResponseExtractions = response.data.data.extractions;
    hateSpeachResponseCategories = response.data.data.categories;

    var response = await AnalyseDocument(context,token,req.body.document, piiUrl);
    pii = response.data.data.extractions;
    
    var piiWanted = "|fin|tel|url|ema|ban|ip"; // financial / telephone / url / email / bank / ip - all block release
    for (var i=0;i<pii.length;i++) 
    {
        var test=pii[i].template.toLowerCase().substring(4,7);
        
        if (piiWanted.indexOf(test)) { // Check for most dangerous subset of PII
            piiResponse += pii[i].fields[0].name + "=>" + pii[i].fields[0].value + "@|@";
            status = "Blocked pending review";
        }
    }
    

    var fullResponse = {
        status: status,
        sentiment: sentimentResponse,
        emotionalTraits: emotionalTraitsResponse,
        hateCategories: hateSpeachResponseCategories,
        hateExtractions: hateSpeachResponseExtractions
    }

    
    if (typeof(response) ==  "string") { // This happens if an error message is returned
        response = JSON.stringify(response);
        context.log.error("Error returned:" + response);
    }
    
    context.res.body = fullResponse; // Needs to be a valid JSON object or an error message string

};

const GetToken = async (context) =>
{
    context.log.info("in getToken");
    var response = '';
    const axios = require('axios');
    context.log.info("loaded axios");
    
    
    context.log.info("set username is" + process.env["expertAiUsername"]);
    // POST request using axios with set headers
    const inputs = {username:  process.env["expertAiUsername"], password: process.env["expertAiPassword"]};
    context.log.info("set inputs");
    const config = { 
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
        },
        forcedJSONParsing: false
    };
    context.log.info("set headers");
    try {
        response = await axios.post('https://developer.expert.ai/oauth2/token', inputs, { config } );
        response = response.data;
    } catch (err)
    {
        context.log.info("got error:" + err);
        response = err;
    }
    return response;
    
};

const AnalyseDocument = async (context, token, doc, urlSuffix) =>
{
    const axios = require('axios');

    const inputs = {
        document: {
            text: doc
        }
    };
    const config = { 
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json; charset=utf-8',
        },
        forcedJSONParsing: false
    };

    try {
        response = await axios.post("https://nlapi.expert.ai/v2/" + urlSuffix, inputs, config);
        //response = await axios.get("https://nlapi.expert.ai/v2/detectors", inputs, config);
        //console.log(response.data);
        
    } catch (err)
    {
        response = err;
    }
    return response;
};