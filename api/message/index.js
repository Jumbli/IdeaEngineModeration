module.exports = async function (context, req)
{

    var token = await GetToken();
    var response = await AnalyseDocument(token,req.body.document);
    
    if (typeof(response) ==  "string") // This happens if an error message is returned
        response = JSON.stringify(response);

    console.log(response);
    context.res.body = response; // Needs to be a valid JSON object or an error message string

};

const GetToken = async () =>
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
        response = "ERROR";
    }
    return response;
    
};

const AnalyseDocument = async (token, doc) =>
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