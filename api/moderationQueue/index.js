module.exports = async function (context, req) {
    
    const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
    
    const account = process.env["accountName"];
    const accountKey = process.env["storageAccountKey"];
    
    const credential = new AzureNamedKeyCredential(account, accountKey);

    const tableClient = new TableClient(process.env["storageUri"], process.env["tableName"], credential);
  
    var keys = [];
    let entitiesIter = tableClient.listEntities();
    let i = 0;
    for await (const entity of entitiesIter) {
        keys.push(entity.rowKey);
        if (i > req.body.maxRows)
            break;
        i++;
    }

    var rows = [];
    for (i=0;i<keys.length;i++)
    {
        var row = await tableClient.getEntity("mainPartition", keys[i])
        rows.push(row);
    }
    
    var fullResponse = {
        rows: rows,
        };
    
    context.res.body = fullResponse; // Needs to be a valid JSON object or an error message string
}