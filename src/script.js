async function submitStory(callType)
{
    document.getElementById("status").innerHTML = "Analysing document...";
    
    var res = await fetch(`/api/message`,
    {
        method: "post",
        body: JSON.stringify(
            {
                function: document.getElementById("action").value,
                document: document.getElementById("testDocument").value
            }
        ),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    var jsonResp="";
    res.json()
    .then (json => {
        if (json.data !== undefined)
            jsonResp = json.data;
        else
            jsonResp = json;
        updateSummary(jsonResp);
        document.querySelector('#feedback').textContent = JSON.stringify(jsonResp);
    })
    .catch(error => {
        jsonResp = "Invalid value returned";
    });
    
};

function updateSummary(res)
{
     
    document.getElementById('status').innerHTML = res.status;
    document.getElementById('traits').innerHTML = res.emotionalTraits;
    document.getElementById('hate').innerHTML = res.hateCategories;
    document.getElementById('sentiment').innerHTML = res.sentiment + " (" + res.sentimentScore + ")";
        
    var summary = document.getElementById('summary');
    summary.innerHTML="<option value='0'>Expand for details</option>";
    
    // Add PII
    var optGroup = document.createElement('optgroup')
    optGroup.label = "Personal information";
    summary.appendChild(optGroup);
    var lines = res.pii;
    if (lines.length == 0)
        AddOption(optGroup,"no issues");

    for (var i=0;i<lines.length;i++) {
        AddOption(optGroup,lines[i].name + "=>" + lines[i].value);
    }

    // Hate
    var optGroup = document.createElement('optgroup')
    optGroup.label = "hate speech";
    summary.appendChild(optGroup);
    var lines = res.hateExtractions;
    if (lines.length == 0)
        AddOption(optGroup,"no issues");

    for (var i=0;i<lines.length;i++)
    {
        AddOption(optGroup,lines[i].name + "=>" + lines[i].value);
    }

    document.querySelector('#feedback').textContent = JSON.stringify(res);  
};    
function AddOption(optGroup, text)
{
    var objOption=document.createElement("option");
    objOption.innerHTML = text;
    objOption.value = summary.options.length;
    optGroup.appendChild(objOption);
}


function DescribeObject(obj)
{
    for(var name in obj) {
        console.log(name);
        var value = obj[name];
        console.log(value);
    }     
}

async function GetModerationQueue(callType) {

    document.getElementById("refreshing").style.display = "inline";
    var res = await fetch(`/api/moderationQueue`,
    {
        method: "post",
        body: JSON.stringify(
            {
                maxRows: 5
            }
        ),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    
    var jsonResp="";
    res.json()
    .then (json => {
        document.getElementById("refreshing").style.display = "none";
        if (json.rows !== undefined)
            jsonResp = json.rows;
        else
            jsonResp = json;
        
            
        var template = document.getElementById("template").getElementsByTagName("TR")[0];
        var tbody = document.getElementById("rows");
        tbody.innerHTML="";
        for (var i=0;i<jsonResp.length;i++)
        {
            var newRow = template.cloneNode(true);
            var tds = newRow.getElementsByTagName("TD");
            var row = JSON.parse(jsonResp[i].Data);
            tds[0].innerHTML = row.id;
            tds[1].innerHTML = row.name;
            tds[2].innerHTML = row.status;
            if (row.comment !== undefined)
            {
                if (row.comment == "")
                    tds[3].innerHTML = "";
                else
                    tds[3].innerHTML = "<button onclick='alert(\"" + row.comment + "\")'>View comment</button>";
            }
            else
                tds[3].innerHTML = "";
            tds[4].getElementsByTagName("INPUT")[0].value = row.document;
            tbody.appendChild(newRow);
        }
        
        
    })
    .catch(error => {
        jsonResp = "Invalid value returned";
    });
    
};

function Fetch(src)
{
     var tds = src.parentNode.parentNode.getElementsByTagName("TD");

     document.getElementById("action").value = "AnalyseDocument";
     var input = tds[4].getElementsByTagName("INPUT")[0];
     document.getElementById("testDocument").value = input.value;
     document.getElementById("analyse").scrollIntoView(true);
}

function ToggleFeedback()
{
    var d = document.getElementById("feedback").style;
    if (d.display == "none")
        d.display = "block";
    else
        d.display = "none";

}

function RemoveRow(src)
{
    var row = src.parentNode.parentNode;
    document.getElementById("rows").removeChild(row);
}

function Reject(src)
{
    var msg = prompt('Enter a message to the user to explain\nwhy we are not approving their project');
    RemoveRow(src);
}

function Approve(src)
{
    RemoveRow(src);
}

function FindText(src)
{
    var text = src.options[src.options.selectedIndex].innerText;
    text = text.substring(text.indexOf(">") +1);
    
    var story = document.getElementById("testDocument");

    var start = story.value.indexOf(text);
    var end = start + text.length;

    story.setSelectionRange(start, start);
    story.focus();
    story.setSelectionRange(start, end);
    
} 

var isStory = true;
function swapOutputPanel(src)
{
    var d = document.getElementById("traitDetails").style;
    
    if (src.value == "AnalyseDocument") {
        isStory = true;
        d.display = "block";
    }
    else {
        isStory = false;
        d.display = "none";
    }
    
}

function popup(id)
{
    document.getElementById('popup1').style.visibility='visible'; 
    var objs = document.getElementById('popupContent').getElementsByTagName("DIV");
    for (var i=0;i<objs.length;i++) {
        if (objs[i].id == id)
            objs[i].style.display = "block";
        else
            objs[i].style.display = "none";
    }

    
}

