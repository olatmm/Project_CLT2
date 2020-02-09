// ==UserScript==
// @name         yard-2-html
// @namespace    http://amazon.com/
// @version      0.10
// @description  Sets the html content for yard-2
// @author       sffinn
// @match        https://trans-logistics.amazon.com/yard-2
// @grant        none
// ==/UserScript==
function setHead() {
    document.head.innerHTML = `<title>yard-2</title>
<style>
html {
font-family: "arial";
}

body {
background-color: #f7f7f7;
}
* {
box-sizing: border-box;
}


a {
display: inline-block;
pointer-events: all;
font-weight: bold;
}
a:link, a:visited {
text-decoration: none;
color: #205493;
}

a:hover {
cursor: pointer;
}
button {
//box-shadow: none;
border:1pt solid black;
//border:none;
text-align: center;
cursor: pointer;
border-radius: 0.2rem;
background-color: ffffff;
line-height: 1.25rem;
}

button:hover {
background-color: lightgray;
}

select {
border:1px solid;
//-webkit-appearance: none;
//-moz-appearance: none;
//appearance: none;       /* remove default arrow */
//background-image: url("data:image/svg;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129 129" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 129 129"><g><path d="m121.3,34.6c-1.6-1.6-4.2-1.6-5.8,0l-51,51.1-51.1-51.1c-1.6-1.6-4.2-1.6-5.8,0-1.6,1.6-1.6,4.2 0,5.8l53.9,53.9c0.8,0.8 1.8,1.2 2.9,1.2 1,0 2.1-0.4 2.9-1.2l53.9-53.9c1.7-1.6 1.7-4.2 0.1-5.8z"/></g></svg>");   /* add custom arrow */
}

textarea {resize: none;
border:1px solid;
}

.sticky {
position: sticky;
top: 0;
left: 7.5%;
//width: 100%;
//height 2rem;
display: inline-block;
//background-color: #232F3E;
margin: auto;
//background-color: #F0F0F0;
// height: 200px
//border: 2px solid #000000;
}
.header_box {
background-color: #232F3E;
width: 100%;
height 2rem;
}
.reloadButton {
position: absolute;
top: 0px;
}

.forcemove-window {
position: fixed;
top: 0px;
right: 50%;
width: 300px;
height: 300px;
background-color: #f9f9f9;
}

.history-title {
font-size: 11px;
font-weight: normal;
}

.history-body {
font-size: 12px;
font-weight: normal;
background-color: white;
}

.padrow1 {height: 8; display:block}

.padcol1 {width: 8; display:inline-block}
.padcol2 {width: 0%; display:inline-block}

.asdf {
-webkit-touch-callout: none
-webkit-user-select: none
-khtml-user-select: none
-moz-user-select: none
-ms-user-select: none
user-select: none;
}

.moveButton {
display: inline-block;
opacity: .80;
}
.moveButton:hover {
opacity: 1.0;
cursor: pointer;
}

.lockImage {
display: inline-block;
opacity: 1;
}

img {
-khtml-user-select: none;
-o-user-select: none;
-moz-user-select: none;
-webkit-user-select: none;
user-select: none;
}

/* The Modal (background) */
.modal {
position: fixed;
left: 0;
top: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.5);
display:none;
}
.layout{
margin-top: 25px;
margin-right: auto;
}

.modal-content {
position: absolute;
top: 34%;
left: 50%;
transform: translate(-50%, -50%);
background-color: white;
padding: 1rem 1.5rem;
border-radius: 0.5rem;
}

.close-button {
float: right;
width: 1.5rem;
line-height: 1.5rem;
text-align: center;
cursor: pointer;
border-radius: 0.25rem;
background-color: lightgray;
}

.close-button:hover {
background-color: darkgray;
}

.show-modal {
opacity: 1;
visibility: visible;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.5);
position: fixed;
left: 0;top: 0;
}

.fixed_header {

table-layout:fixed;
}

.fixed_header td {
bordder-color: #464646;
bordder: 1px solid #464646;
overflow: hidden;
}

.fixed_header thead{
background-color: #333333;
}
.fixed_header tbody{
display:block;
overflow-y: scroll;
}

.fixed_header thead tr{
display:block;
}

</style>


`;
}

function setBody() {
    document.body.innerHTML = `

<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">


<div class="container-fluid">
        <nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark mb-5">
            <a class="navbar-brand" href="https://trans-logistics.amazon.com">CLT2-YARD2</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse"
                aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarCollapse">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item active">
                        <a class="nav-link" href="https://trans-logistics.amazon.com/yard-2">Yard 2<span
                                class="sr-only">(current)</span></a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href=" https://trans-logistics.amazon.com/hostlerdash">Hostler Dashboard</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="https://trans-logistics.amazon.com/moves" tabindex="-1"
                            aria-disabled="true">Moves</a>
                    </li>
                </ul>
                <form class="form-inline mt-2 mt-md-0">
                    <div class="padcol2"></div>
                    <div class="sticky">
                        <input class="form-control mr-sm-2" id="iSearch" type="text" placeholder="Search"
                            aria-label="Search">
                        <button class="btn btn-outline-success my-2 my-sm-0 mr-2" id="bReload"
                            type="submit">Reload</button>
                        <button class="btn btn-outline-primary my-2 my-sm-0" id="bCsv" type="submit">Download</button>
                    </div>
                </form>
            </div>
        </nav>
</div>
<div class="container layout float-left">
<table class="table table-dark table-bordered mt-5">
<tbody>
<tr>
<td id="output"></td>
</tr>
</tbody>
</table>
</div>
<div id="wModal" class="modal">
<div id="modal-content" class="modal-content"><span id="bClose" class="close-button" style="display: block;">Ã—</span>
<div id="moveWindow" style="display: none;">
<p>Move window</p>
<div id="sMoveTrailer"></div>
<div class="padrow1"></div>
<select id="selectParkingSpot"></select>
<input id="cbForce" name="vehicle1" value="Move" type="checkbox"> Force Move
<div class="padrow1"></div>
<button id="bSubmit" style="text-align: center; float: right;">Create Move</button>
</div>
<div id="editWindow" style="display: block;">
<p>Edit window</p>
<div style="display:inline-block" id="sEditTrailer"></div> <div style="display:inline-block">    </div>
<select id="selectVisitReason" data-asset-id="10938304">
<option value="INBOUND">INBOUND</option>
<option value="OUTBOUND">OUTBOUND</option>
<option value="NON_INVENTORY">NON_INVENTORY</option>
<option value="OTHER">OTHER</option>
</select>
<div class="padrow1"></div>
<div style="display:inline-block">Status </div>
<select style="display:inline-block" id="selectStatus">
<option value="FULL">FULL</option>
<option value="EMPTY">EMPTY</option>
<option value="IN_PROGRESS">IN_PROGRESS</option>
<option value="PAUSED">PAUSED</option>
</select>
<div class="padrow1"></div>
<textarea id="tNotes" rows="4" cols="40&quot;">            </textarea>
<div class="padrow1"></div>
<button id="bSubmitEdit" style="text-align: center; float: right;">Submit Edit</button>
</div>

<div id="historyWindow" style="display: none;">
<p>History window</p>
<table id="tHistory"><tbody><tr class="history-title"><td>Action</td><td>Location</td><td>Time</td><td>User</td></tr><tr class="history-body"><td>YardAssetChangeLoadEvent</td><td>NOT_IN_YARD</td><td>1546595053</td><td>jsstenbe</td></tr><tr class="history-body"><td>CheckInEvent</td><td>ENTRY_GATE</td><td>1546595053</td><td>jsstenbe</td></tr><tr class="history-body"><td>YardAssetsMoveEvent</td><td>ENTRY_GATE</td><td>1546595053</td><td>jsstenbe</td></tr><tr class="history-body"><td>YardAssetUpdateEvent</td><td>ENTRY_GATE</td><td>1546595053</td><td>jsstenbe</td></tr><tr class="history-body"><td>YardAssetsMoveEvent</td><td>CH066</td><td>1546595053</td><td>jsstenbe</td></tr></tbody></table>
</div>
</div>
</div>
<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>
`;
}
(function() {
    'use strict';
    setHead();
    setBody();
})();