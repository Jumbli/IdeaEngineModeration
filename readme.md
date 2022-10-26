# Metaverse Moderator

This is an early pre-release version and is in active development

**MeMo is a cloud-based solution for all your text moderation needs, providing web services for easy integration from VR apps and a web page to perform your moderation tasks.**

All analysis is performed by Expert.ai APis.
Further details can be found at: https://docs.expert.ai/nlapi/latest/

Azure static web apps, storage solutions and web functions are used to provide the VR integration and moderation platform.

## Demo
Demo https://icy-beach-02d319c0f.2.azurestaticapps.net/

## Detailed description
See https://devpost.com/software/metaverse-moderation

## Message - analysis service
The "message" web service is the core entry point for analysing text based content.
See script.js in the web app for examples on how it is consumed.

```
Request format
{
    "function": "AnalyseDocument", // or AnalyseReview
    "document", "All document text here"
}

Example response format:
{
    "status":"Blocked", // or OK
    "sentiment":"neutral", // or positive or negative
    "sentimentScore":-2.4,
    "emotionalTraits":"Resentment, Delite",
    "hateCategories":"Racism, Threat and Violence",
    "hateExtractions":[ // category and problem text
        {"name":"hate","value":"i hate people like you"},
        {"name":"violence","value":"i will murder you"}],
    "pii":[ // category and problem text
        {"name":"email","value":"me@email.com"},
        {"name":"telephone","value":"01143 678765"}]}
}
```

## Next steps:
An Azure queue will be used instead of a table.
Security will be further considered.
