module.exports = async function (context, req)
{
    context.log.info("running message");
    var token = await GetToken(context);
    context.log.info("got token");
    var response = await AnalyseDocument(context,token,req.body.document);
    context.log.info("got document");
    
    if (typeof(response) ==  "string") { // This happens if an error message is returned
        response = JSON.stringify(response);
        context.log.error("Error returned:" + response);
    }
    context.log.info(response);
    console.log(response);
    context.res.body = response; // Needs to be a valid JSON object or an error message string

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
        context.log.info("got response");
        response = response.data;
    } catch (err)
    {
        context.log.info("got error:" + err);
        response = "ERROR";
    }
    return response;
    
};

const AnalyseDocument = async (context, token, doc) =>
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
        response = await axios.post('https://nlapi.expert.ai/v2/analyze/standard/en/entities', inputs, config);
        response = response.data;
    } catch (err)
    {
        response = "ERROR";
    }
    return response;
};