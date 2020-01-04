// ==UserScript==
// @name         yard-2
// @namespace    http://tampermonkey.net/
// @version      0.17
// @description  searches the yard
// @author       sffinn
// @match        https://trans-logistics.amazon.com/yard-2
// @grant        none
// ==/UserScript==

function pushCell(row,content) {
    let len = row.cells.length;
    let newCell = row.insertCell(len);
    newCell.innerHTML = content;
    return newCell
}

var getYardStart; /* performance testing */
var getYardEnd; /* performance testing */
var doEditStart; /* performance testing */
var doEditEnd; /* performance testing */
var doMoveStart; /* performance testing */
var doMoveEnd; /* performance testing */

var yard = {
    Assets: [],
    Locations : [],
    Movements : [],
    moveAssets : [],
    SearchResults: [],
    /*
    Selected : {
        AssetID : 0,
        LocationID : 0,
        Row : 0,
        selectRow : function() {
        }
    },*/

    GetYard : function() {
        getYardStart = performance.now(); /* performance testing */
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.listLocationsWithYardAssetsV2";
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.ParseYard, payload);
        yard.Assets.length = 0;
        yard.Locations.length = 0;
        yard.GetMoves();
        yard.GetExit();
        yard.GetUnknown();
        yard.GetTransit();
    },
    GetExit : function() {
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.getLocationWithYardAssetsByType";
        payload.locationType = "ExitGate";
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.ParseExit, payload);
    },
    GetUnknown : function() {
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.getLocationWithYardAssetsByType";
        payload.locationType = "UnknownLocation";
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.ParseUnknown, payload);
    },
    GetTransit : function() {
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.getLocationWithYardAssetsByType";
        payload.locationType = "InTransitLocation";
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.ParseExit, payload);
    },
    GetHost : function() {
        var payload = {};
        //payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.getServerTime";getYardPreference
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.getYardPreference";
        payload.yardCode = "CLT2";
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.Debug, payload);
    },
    GetHistory : function(id) {
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.getYardAssetDetailsSinceCheckIn";
        payload.id = id;
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.ParseHistory, payload);
    },
    GetMoves : function() {
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.listHostlerMoves";
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.ParseMoves, payload);
    },
    GetMoveLocations : function() {
        var Force = document.getElementById("cbForce");
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.listLocationsAvailableForYardAssets";
        payload.yardAssetIds = [];
        payload.yardAssetIds.push(yard.selected.id);
        payload.force = Force.checked;
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.ParseMoveLocations, payload);
    },
    ForceMove : function(AssetID, SourceID, DestinationID, Force) {
        if(DestinationID==0) {
            //Need to fix unknown
            //DestinationID = yard.UnknownID;
        }
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.createMovement";
        payload.yardAssetIdsAndSeals = [{}];
        payload.yardAssetIdsAndSeals[0].yardAssetId = AssetID;
        payload.yardAssetIdsAndSeals[0].sealNumbers = [];
        payload.sourceLocationId = SourceID;
        payload.targetLocationId = DestinationID;
        payload.force = Force;
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.CheckError, payload);
    },
    EditAsset : function(ymsAsset) {
        var payload = {};
        payload.method = "com.amazon.yms.coral.privateapi.YMSServiceInternal.updateAsset";
        payload.updateModel = ymsAsset;
        payload.context = {};
        payload.context.securityToken = yard.token;
        ymsPost(yard.GetYard, payload);
    },
    CheckError : function(a) {
        if(a.search("xcept") != -1) {
            alert(a);
        }
        yard.GetYard();
    },
    ParseMoveLocations : function(a) {
        var obj = JSON.parse(a);
        console.log(obj);
        var x; var option;
            x = document.getElementById("selectParkingSpot");
            x.innerHTML = "";
        /invalidLocations = [];/

        option = document.createElement("option");
        option.text = "EXIT_GATE";
        x.add(option);

        obj.locationList.forEach(function(location) {
            option = document.createElement("option");
            option.text = location.code;
            x.add(option);
        });
    },
    Debug : function(a) {
        console.log(a);
    },
    ParseExit : function(a) {
        var obj = JSON.parse(a);
        yard.ParseLocation(obj.location);
        yard.exitGateId = obj.location.id;
    },
    ParseUnknown : function(a) {
        var obj = JSON.parse(a);
        //console.log(obj.location.id);
        yard.unknownId = obj.location.id;
        yard.ParseLocation(obj.location);
    },
    ParseHistory: function(a) {
        var obj = JSON.parse(a);
        var row; var cell;
        var tHistory = document.getElementById('tHistory');
        tHistory.innerHTML = "<tr class='history-title'><td>Action</td><td>Location</td><td>Time</td><td>User</td></tr>";
        obj.yardAsset.events.forEach(function(event){
            if(tHistory.rows.length<10) {
                row = tHistory.insertRow(tHistory.rows.length);
                row.classList.add('history-body');
                cell = row.insertCell(row.cells.length);
                cell.innerHTML = event.type;
                cell = row.insertCell(row.cells.length);
                cell.innerHTML = event.location.code;
                cell = row.insertCell(row.cells.length);
                var dateTime = new Date(event.timestampUtc*1000)
                cell.innerHTML = dateTime.toLocaleString();
                cell = row.insertCell(row.cells.length);
                cell.innerHTML = event.userId;
            }
        });
        setModal('historyWindow');
        toggleModal();
    },
    ParseYard : function(a) {
        var newSpot;
        var newAsset;
        var obj = JSON.parse(a);
        obj.locationsSummaries[0].locations.forEach(yard.ParseLocation);
        yard.RefreshScreen()
        getYardEnd = performance.now(); /* performance testing */
        console.log('Yard reload took: ' + (getYardEnd-getYardStart) + ' ms');/* performance testing */
        sendMetrics({site:yard.site,login:yard.login, action:"refresh"});
    },
    PreparseLocation : function(location) {
        console.log(location);
        yard.ParseLocation(location);
    },
    ParseLocation : function(location) {
            if(location.regularInYardLocation==false && location.yardAssets.length==0){return}

            var newSpot = {};
            var newMove = {s_move : "",moveExecutor : "",moveSpot : ""};
            newSpot.name = location.code.trim();
            newSpot.type = location.type;
            newSpot.id = location.id;
            newSpot.empty = true;
            if(location.movements!==undefined) {
                location.movements.forEach(function(move) {
                        newMove.s_move = move.sourceLocation.name + " > " + move.targetLocation.name;
                        newMove.trailerNum = move.yardAssets[0].vehicleNumber;
                    if(move.executor) {
                        newMove.moveExecutor = move.executor;
                    } else {
                        move.executor = "";
                    }
                    if(location.yardAssets[0] === undefined) {
                        location.yardAssets.push(move.yardAssets[0]);
                    }
                });
            }
            location.yardAssets.forEach(function(asset) {
                newSpot.empty = false;
                var newAsset = {};
                newAsset.elem = document.createElement("tr");
                //console.log(newAsset.elem);
                if(asset.lockedBySSP==true) {
                    //asset is locked by ssp
                    //https://s3.amazonaws.com/yms-static-assets/YMSWebsiteAngularApp-3_0_200203_0/assets/images/lock.png
                }
                newAsset.ymsAsset = asset;
                newAsset.owner = asset.owner.code;
                newAsset.vehicleNumber = asset.vehicleNumber;
                newAsset.id = asset.id;
                newAsset.location = location.code;
                if(newAsset.status = asset.status){}
                else {
                    newAsset.status = "";
                }
                newAsset.type = asset.type;
                if(newAsset.visitReason = asset.visitReason) {}
                else {
                    newAsset.visitReason = "";
                }
                if(newAsset.licensePlate = asset.licensePlateIdentifier.registrationIdentifier) {}
                else {
                    newAsset.licensePlate = "N/A"
                }
                if(newMove.trailerNum == newAsset.vehicleNumber) {
                    newAsset.s_move = newMove.s_move;
                    newAsset.moveExecutor = newMove.moveExecutor;
                } else {
                    newAsset.s_move = "";
                    newAsset.moveExecutor = "";
                }
                if(newAsset.notes = asset.annotation) {}
                else {
                    newAsset.notes = "";
                }
                if(asset.load) {
                    asset.load.identifiers.forEach(function(loadID) {
                    newAsset.loadId = loadID.identifier;
                    newAsset.load = loadID.identifier;
                    newAsset.load += "<br /> " + loadID.type;
                    newAsset.load += " " + asset.load.lane;
                    });
                    newAsset.loadType = asset.load.shipperAccounts[0];
                    if(!newAsset.loadType || newAsset.loadType == "TransfersInitialPlacement") {
                        newAsset.loadType = "";
                    }
                }
                else {
                    newAsset.load = "";
                    newAsset.loadId = "";
                    newAsset.loadType = "";
                }
                newAsset.searchString = newAsset.location + newAsset.licensePlate + newAsset.type + newAsset.load + newAsset.loadType;
                newAsset.searchString += newAsset.status + newAsset.notes + newAsset.vehicleNumber + newAsset.visitReason + newAsset.owner;
                newAsset.searchString += newAsset.s_move + (asset.condition?asset.condition:"");
                newAsset.searchString = newAsset.searchString.toUpperCase();
                yard.GenerateRow(newAsset);
                yard.Assets.push(newAsset);
            });
            if(newSpot.empty == true && location.type != "OffSiteLocation") {
                var newAsset = {};
                newAsset.elem = document.createElement("tr");
                newAsset.location = newSpot.name;
                newAsset.vehicleNumber = "EMPTYSPOT";
                newAsset.owner = "";
                newAsset.visitReason = "";
                newAsset.status = "";
                newAsset.s_move = " ";
                newAsset.moveExecutor = "";
                newAsset.load = "";
                newAsset.loadType = "";
                newAsset.searchString = newAsset.location + newAsset.vehicleNumber;
                newAsset.searchString = newAsset.searchString.toUpperCase();
                yard.GenerateRow(newAsset);
                yard.Assets.push(newAsset);
            }
            yard.Locations.push(newSpot);
    },
    ParseMoves : function(a) {
        var obj = JSON.parse(a);
        var newMove;
        yard.Movements.length = 0;
        obj.movements.forEach(function(move) {
            newMove = {};
            newMove.s_move = move.sourceLocation.name + " > " + move.targetLocation.name;
            newMove.trailerNum = move.yardAssets[0].vehicleNumber;
            if(move.executor) {
                newMove.moveExecutor = move.executor;
            } else {
                newMove.moveExecutor = "";
            }
            yard.Movements.push(newMove);
        });
    },
    GenerateRow : function(asset) {
            yard.SearchResults.push(asset);
            var row = asset.elem;
            row.classList.add("output");
            row.id = asset.id;
            var newCell;
            //Parking Spot
            newCell = pushCell(row,asset.location);
            newCell.style.fontSize = "17px";
            //vehicleNumber
            newCell = row.insertCell(row.cells.length);
            if(asset.vehicleNumber=="EMPTYSPOT") {
                newCell.innerHTML = asset.vehicleNumber.bold();
            } else {
            //history link
                let a = document.createElement('a');
                a.innerHTML = asset.vehicleNumber;
                a.onclick = function(){yard.GetHistory(asset.id); return false;};
                a.href = "";
                newCell.appendChild(a);
            }
            let plate = document.createElement("div");
            plate.innerHTML = asset.licensePlate;
            newCell.appendChild(plate);
            //licensePlate
            //pushCell(row,asset.licensePlate);
            //assetOwner
            pushCell(row,asset.owner.bold() + "<br />" + asset.type);
            //assetType
            //pushCell(row,asset.type);
            //visitReason
            pushCell(row,asset.visitReason.bold());
            //assetStatus
            pushCell(row,asset.status.bold());
            //loadId
            pushCell(row,asset.load);
            //checkMove
            const result = yard.Movements.filter(move => move.trailerNum == asset.vehicleNumber);
            if(result.length > 0) {
                //moveInfos
                newCell = row.insertCell(row.cells.length);
                newCell.innerHTML = result[0].s_move + "<br \>" + result[0].moveExecutor;
                newCell = row.insertCell(row.cells.length);
            } else if(asset.vehicleNumber != "EMPTYSPOT") {
                //moveInfos
                newCell = row.insertCell(row.cells.length);
                newCell.innerHTML = "";
                //moveButton
                newCell = row.insertCell(row.cells.length);
                if(result.length == 0) {
                    addMoveButton(newCell, asset);
                }
            } else {
                newCell = row.insertCell(row.cells.length);
            }
            //editButton
            newCell = row.insertCell(row.cells.length);
            if(asset.vehicleNumber != "EMPTYSPOT") {
                addEditButton(newCell, asset);
            } else {
                newCell = "note";
                newCell = row.insertCell(row.cells.length);
            }
            //loadType
            newCell = row.insertCell(row.cells.length);
            newCell.innerHTML = asset.loadType + " " + asset.notes;
    },
    SearchAsset : function(asset) {
        var display = 1;
        yard.search.value.split(" ").forEach(function(str) {
            if(asset.searchString.search(str.toUpperCase()) == -1) {
                display = 0;
            }
        });
        return display;
    },
    BuildBody : function(body,asset) {
        let row = asset.elem;
        //let body = yard.output.getElementsByTagName('tbody')[0];
        row.classList.add("output");
        row.id = asset.id;
        body.appendChild(row);
        return body;
    },
    OutputYard : function() {
        var a = performance.now();/* performance testing */
        let rows;
        let body = document.createElement("tbody");
        yard.output.innerHTML = "";
        yard.SearchResults.length = 0;
        if(1){//yard.search.value != "") {
            yard.SearchResults = yard.Assets.filter(yard.SearchAsset);
            body = yard.SearchResults.reduce(yard.BuildBody, body);
            //yard.Assets.filter(asset => asset.Check(yard.search.value));
        }
        //console.log(rows);
        yard.output.appendChild(body);
        var b = performance.now();/* performance testing */

        console.log('Yard search took: ' + (b-a) + ' ms');/* performance testing */

        var time = (new Date()).getTime();
        if (time > yard.lastSearch + 1000 * 10) {
            sendMetrics({site:yard.site,login:yard.login, action:"search"});
        } else {
            console.log(yard.lastSearch/1000, time/1000);
        }
        yard.lastSearch = time;
        //body.innerHTML = rows.join(" ");
    },
    RefreshScreen : function() {
        yard.OutputYard()
    }
};

function preloadImage(url) {
    var img=new Image();
    img.src=url;
    img.style.pointerEvents = "none";
    return img;
}

var newMove = {
    AssetID : 0,
    SourceID : 0,
    TargetID : 0,
    vehicleNumber : "",
    sourceCode : "",
    targetCode : "",
    clear : function() {
        newMove.AssetID = 0;
        newMove.SourceID = 0;
        newMove.TargetID = 0;
        newMove.vehicleNumber = "";
        newMove.sourceCode = "";
        newMove.targetCode = "";
    },
    fill : function() {
        //console.log(newMove.targetCode.search(""), "WHAT IS?");

        yard.Locations.forEach(function(location) {
            if(location.name == newMove.sourceCode) {
                newMove.SourceID = location.id;
            }
            if (location.name == newMove.targetCode) {
                console.log("Found:", location);
                newMove.TargetID = location.id;
            }
        });
        if(newMove.targetCode == "UNKNOWN") {
            newMove.TargetID = yard.unknownId;
        } else if(newMove.sourceCode == "UNKNOWN") {
            newMove.SourceID = yard.unknownId;
        }
    }
}

var newEdit = {
    id:0
}

function addMoveButton(element, id) {
    var button = document.createElement("div");
    button.classList.add('moveButton');
    button.appendChild(moveImg.cloneNode(true));
    button.onclick = function(event){
        startMove(event.originalTarget.parentNode.parentNode.id);
    };
    element.appendChild(button);
}

function addEditButton(element, id) {
    var button = document.createElement("div");
    button.classList.add('moveButton');
    button.appendChild(editImg.cloneNode(true));
    button.onclick = function(){startEdit(id)};
    element.appendChild(button);
}

function startMove(assetId) {
    console.log(assetId);
    let asset = getAssetFromId(assetId);
    setModal('moveWindow');
    console.log("startMove", assetId, asset);
    yard.selected = asset;
    //setup window
    var sMoveTrailer = document.getElementById("sMoveTrailer");
    sMoveTrailer.innerHTML = asset.owner + " " + asset.vehicleNumber;
    toggleModal();
    //setup move
    newMove.clear();
    newMove.AssetID = asset.id;
    newMove.sourceCode = asset.location;
    newMove.vehicleNumber = asset.vehicleNumber;
    yard.GetMoveLocations(asset.id);
}

function startEdit(asset) {
    var editWindow = document.getElementById("selectVisitReason");
    yard.selected = asset;
    setModal('editWindow');
    newEdit.id = asset.id;
    editWindow.setAttribute("data-asset-id", asset.id);
    //visit reason select
    var selectVisitReason = document.getElementById("selectVisitReason");
    selectVisitReason.value = asset.visitReason;
    //status select
    var selectStatus = document.getElementById("selectStatus");
    selectStatus.value = asset.status;
    //notes input
    var tNotes = document.getElementById("tNotes");
    tNotes.value = asset.notes;
    //setup window
    var sEditTrailer = document.getElementById("sEditTrailer");
    sEditTrailer.innerHTML = asset.owner + " " + asset.vehicleNumber;
    toggleModal();
}

function createMove() {
    var select = document.getElementById("selectParkingSpot");
    newMove.targetCode = select.value;
    newMove.fill();//AssetID, SourceID, DestinationID, Force
    var cbForce = document.getElementById("cbForce");
    yard.ForceMove(newMove.AssetID, newMove.SourceID, newMove.TargetID, cbForce.checked);
    toggleModal();
    sendMetrics({site:yard.site,login:yard.login, action:"move"});
}

function createEdit() {
    var selectVisitReason = document.getElementById("selectVisitReason");
    var selectStatus = document.getElementById("selectStatus");
    var tNotes = document.getElementById("tNotes");
    var editWindow = document.getElementById("editWindow");
    var visitReason = selectVisitReason.value;
    var status = selectStatus.value;
    var notes = tNotes.value;
    //var asset = getAssetFromId(editWindow.getAttribute("data-asset-id"));
    var asset = getAssetFromId(newEdit.id);
    var needsEdit = false;
    if(visitReason != asset.visitReason) {
        asset.ymsAsset.visitReason = visitReason;
        needsEdit = true;
    }
    if(status != asset.status) {
        asset.ymsAsset.status = status;
        needsEdit = true;
    }
    if(notes != asset.notes) {
        asset.ymsAsset.annotation = notes;
        needsEdit = true;
    }
    if(needsEdit == true) {
        yard.EditAsset(asset.ymsAsset);
        sendMetrics({site:yard.site,login:yard.login, action:"edit"});
    }
    toggleModal();
}

function getAssetFromId(id) {
    var returnVal;
    yard.Assets.forEach(function(asset) {
        if(asset.id == id) {
            returnVal = asset;
        }
    });
    return returnVal;
}

function httpget(url, callback) {
    var xmlhttp=new XMLHttpRequest();

    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4) {
                callback(xmlhttp.responseText);
        }
    };

    try {
        xmlhttp.open("GET",url,true);
        xmlhttp.send();
    }
    catch(e) {
        alert("invalid");
    }
}

function ymsPost(callback, payload) {
    var url = "https://yms-na.amazon.com/YMSServiceInternal/"
    var xmlhttp=new XMLHttpRequest();
    xmlhttp.onreadystatechange=function() {
        if (xmlhttp.readyState==4) {
            callback(xmlhttp.responseText);
        }
    };
    try {
        xmlhttp.open("POST",url,true);
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.setRequestHeader("Content-Encoding", "amz-1.0");
        xmlhttp.setRequestHeader("X-Amz-Target", payload.method);
        xmlhttp.send(JSON.stringify(payload));
    }
    catch(e) {
        alert("invalid post request " + payload.method);
    }
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}

function sendMetrics(keyValue) {
    var resp = "";
    for (var key in keyValue) {
        resp += key + ":" + keyValue[key] + "|";
    }
    resp = resp.substring(0, resp.length - 1);
    preloadImage("http://ec2-34-228-212-134.compute-1.amazonaws.com/usage/" + resp);
}

function getToken() {
    httpget("https://trans-logistics.amazon.com/yms/shipclerk/", parseToken);
}

function parseToken(a) {
    var tok1 = a.split("window.ymsSecurityToken = \"");
    var tok2 = tok1[1].split("\";");
    yard.token = tok2[0];

    yard.login = a.match(/\w+@/i)[0];
    yard.login = yard.login.substring(0, yard.login.length - 1);
    yard.site = a.match(/\"::\" \+ \"\w+\";/i)[0].split("\"")[3];

    sendMetrics({site:yard.site,login:yard.login, action:"connect"});
    //yard.GetYard();
    yard.GetYard();
}

function download_csv() {
    var csv = 'Location,Trailer Id,Owner,Hours,VisitReason,Type,Status,Load,Notes\n';
    yard.SearchResults.forEach(function(asset){
        if(asset.vehicleNumber=="EMPTYSPOT") {
            return;
        }

        csv += asset.location + ",";
        csv += asset.vehicleNumber + ",";
        csv += asset.owner + ",";
        csv += (((Date.now()/1000) - asset.ymsAsset.datetimeOfArrivalInYard)/(60*60)) + ",";
        csv += asset.visitReason + ",";
        csv += asset.type + ",";
        csv += asset.status + ",";
        csv += asset.loadId + ",";
        csv += asset.notes.replace(/(\r\n\t|\n|\r\t)/gm, ""); + ",";
        csv += "\n";
    });
    //
    var downloadLink = document.createElement("a");
    var url = 'data:text/csv;charset=UTF-8,' + encodeURIComponent(csv)
    downloadLink.href = url;
    downloadLink.download = "data.csv";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function autoReload() {
    setInterval(yard.GetYard, 3 * 60 * 1000);
}

function setModal(id) {
    //console.log(id);
    var button = document.getElementById('bClose');
    var window = document.getElementById(id);
    var children = document.getElementById("modal-content").children;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        child.style.display = "none";
    }
    button.style.display = "block";
    window.style.display = "block";
}

function toggleModal() {
    var modal = document.getElementById("wModal");
    modal.classList.toggle("show-modal");
    modal.classList.toggle("modal");
}

function setEvents() {
    var bClose = document.getElementById("bClose");
    var iSearch = document.getElementById("iSearch");
    var bReload = document.getElementById("bReload");
    var bSubmit = document.getElementById("bSubmit");
    var bSubmitEdit = document.getElementById("bSubmitEdit");
    var cbForce = document.getElementById("cbForce");
    yard.search = document.getElementById("iSearch");
    yard.output = document.getElementById("output");

    iSearch.oninput = yard.OutputYard;
    cbForce.oninput = yard.GetMoveLocations;
    bReload.onclick = yard.GetYard;
    bSubmit.onclick = createMove;
    bSubmitEdit.onclick = createEdit;
    bClose.onclick = toggleModal;

    var bCsv = document.getElementById("bCsv");
    bCsv.onclick = download_csv;
}

function empty(){
    alert("Functon currently not implemented");
}
var moveImg; var editImg; var lockImg;
(function() {
    yard.lastSearch = (new Date()).getTime();
    setTimeout(function(){
    'use strict';
    moveImg = preloadImage("https://drive.corp.amazon.com/view/sffinn@/CLT2-Transportation/Resource/request_move.png");
    editImg = preloadImage("https://drive.corp.amazon.com/view/sffinn@/CLT2-Transportation/Resource/note_added.png");
    //lockImg = preloadImage("https://s3.amazonaws.com/yms-static-assets/YMSWebsiteAngularApp-3_0_200203_0/assets/images/lock.png");
    setEvents();
    getToken();
    autoReload();
    },100);
})();