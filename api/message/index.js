module.exports = async function (context, req)
{
    const codes = 
    {
        "1000": "Personal Insult",
        
        "2100": "Racism",
        "2200": "Sexism",
        "2300": "Ableism",
        "2400": "Religious Hatred",
        "2500": "Homophobia",
        "2600": "Classism",
        "2700": "Body Shaming",
        "3000": "Threat and Violence",
        // Emotional traits
        "0100": "Rage",
        "0200": "Apprehension",
        "0300": "Distress",
        "0400": "Resentment",
        "0500": "Dejection",
        "0600": "Surprise",
        "0700": "Delight",
        "0800": "Fondness"
        
    }
    const sentimentUrl = "analyze/standard/en/sentiment";
    const emotionalTraitsUrl = "categorize/emotional-traits/en?features=extradata";
    const piiUrl = "detect/pii/en";
    const hateSpeachUrl = "detect/hate-speech/en";

    
    var apiRequired="";
 
    var sentimentResponse="";
    var sentimentScoreResponse = "0";
    var emotionalTraitsResponse="";
    var hateSpeachResponseExtractions="";
    var hateSpeachResponseCategories="";
    var piiExtractions=[];

    var response="";
    var token = await GetToken(context);


    // Sentiment
    response = await AnalyseDocument(context,token,req.body.document, sentimentUrl);
    sentimentScoreResponse = response.data.data.sentiment.overall;
    sentimentResponse = "neutral";
    if (parseInt(sentimentScoreResponse) > 3)
        sentimentResponse = "positive";
    if (parseInt(sentimentScoreResponse) < -3)
        sentimentResponse = "negative";
        
    var level1Count = 0; 
    // Emotional traits
    if (req.body.function == "AnalyseDocument") {
        var response = await AnalyseDocument(context,token,req.body.document, emotionalTraitsUrl);
        var groups = response.data.data.extraData.groups;
        var words = [];
        for (var i=0;i<groups.length;i++)
        {
            if (groups[i].position == 1)
                level1Count++;
            var c = codes[groups[i].id];
            if (words.includes(c) == false)
                words.push(c)
        }
        
        //Sometimes short responses give erroneous results, so this works around that issue
        if (groups.length >= 8 && level1Count == groups.length)
            emotionalTraitsResponse="";
        else
            emotionalTraitsResponse = words.join(", ");
    }
    

    // Hate speech
    response = await AnalyseDocument(context,token,req.body.document, hateSpeachUrl);
    var ext = response.data.data.extractions;
    hateSpeachResponseExtractions = [];

    for (var i=0;i<ext.length;i++)
    {
        var fields = ext[i].fields;
        for (var j=0;j<fields.length;j++)
        {
            var category = fields[j].name;
            if (category.indexOf("target") < 0)
            {
                if (category.indexOf("full") >= 0)
                    category = "hate";
                hateSpeachResponseExtractions.push(
                {
                    name: category,
                    value: fields[j].value
                });
            }
        }
    }

     
    var groups = response.data.data.categories;
    var words = [];
    for (var i=0;i<groups.length;i++)
    {
        var c = codes[groups[i].id];
        if (words.includes(c) == false)
            words.push(c)
    }
    var hateSpeachResponseCategories = words.join(", ");

    

    // PII
    response = await AnalyseDocument(context,token,req.body.document, piiUrl);
    pii = response.data.data.extractions;
    
    piiWanted = "|fin|tel|url|ema|ban|ip"; // financial / telephone / url / email / bank / ip - all block release
    piiExtractions = [];
    for (var i=0;i<pii.length;i++) 
    {
        var test=pii[i].template.toLowerCase().substring(4,7);
        
        if (piiWanted.indexOf(test) >= 0) { // Check for most dangerous subset of PII
            piiExtractions.push(
            {
                name: pii[i].fields[0].name,
                value: pii[i].fields[0].value
            });
        }
    }

    var status='OK';
    if (piiExtractions.length > 0)
        status = "Blocked - PII"; // sensitive personal data found or URLs
    else
    {
        if ((req.body.function == "AnalyseReview" && hateSpeachResponseExtractions.length > 0))
            status = "Blocked - hate"; // Zero tollerance hate speach in reviews
        else {
            if (sentimentScoreResponse < -15 || 
                (hateSpeachResponseCategories != "" && sentimentScoreResponse < -.5))
                status = "Blocked - negative";
            else {
                if (hateSpeachResponseExtractions.length > 0)
                    status = "OK - check for hate"
            }
        }
    }


    var fullResponse = {
        status: status,
        sentiment: sentimentResponse,
        sentimentScore: sentimentScoreResponse,
        emotionalTraits: emotionalTraitsResponse,
        hateCategories: hateSpeachResponseCategories,
        hateExtractions: hateSpeachResponseExtractions,
        pii: piiExtractions
    }

    
    if (typeof(response) ==  "string") { // This happens if an error message is returned
        response = JSON.stringify(response);
        context.log.error("Error returned:" + response);
    }
    
    context.res.body = fullResponse; // Needs to be a valid JSON object or an error message string

};

const GetToken = async (context) =>
{

    var response = '';
    const axios = require('axios');

    // POST request using axios with set headers
    const inputs = {username:  process.env["expertAiUsername"], password: process.env["expertAiPassword"]};
    const config = { 
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
        },
        forcedJSONParsing: false
    };
    
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
        
    } catch (err)
    {
        response = err;
        console.log(err);
        context.log(err);
    }
    return response;
};

    
