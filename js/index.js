// I am  leaderboard-example/js/index.js from https://github.com/domschiener/leaderboard-example.git
// modded by raxy, last upd on 30jan18, beautified by http://jsbeautifier.org/
// uses iota.js v0.4.6

function formattedNow( unixMillis){
   var date = new Date( unixMillis);
   var year = date.getFullYear(); //full year in yyyy format
   var month = (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1); //adding leading 0 if month less than 10 for mm format. Used less than 9 because javascriptmonths are 0 based.
   var day = (date.getDate() < 10 ? '0' : '') + date.getDate(); //adding leading 0 if date less than 10 for the required dd format
   var hours = (date.getHours() < 10 ? '0' : '') + date.getHours(); 
   var minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(); //adding 0 if minute less than 10 for the required mm format
   var sec = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
   return day + '/' + month + '/' + year + '@' + hours + ':' + minutes + ':'+ sec ;
}

$(document).ready(function() {
   /*    
       var iota = new IOTA({ //ERR_CONNECTION_REFUSED!
           'host': 'http://iota.pro-servers.de',
           'port': 14700
       });
       var iota = new IOTA({ // error 500!
           'host': 'http://cryptoiota.win',
           'port': 14265
       }); 
       var iota = new IOTA({
           'host': 'http://eugene.iota.community', // ERR_CONNECTION_TIMED_OUT !
           'port': 14265
       });
       var iota = new IOTA({
           'host': 'http://IOTAserver.raganius.com', // ERR_CONNECTION_TIMED_OUT !
           'port': 14600
       });
       var iota = new IOTA({
           'host': 'http://potato.iotasalad.org', // 403 (Forbidden) !
           'port': 14265
       });
   */
   var iota;

   var seed;
   var address;
   var checkedTxs = 0;

   function toggleSidebar() {
      $(".button").toggleClass("active");
      $("main").toggleClass("move-to-left");
      $(".sidebar-item").toggleClass("active");
      $(".sidebar").toggleClass("donotdisplay");
   }
   //
   // Properly formats the seed, replacing all non-latin chars with 9's
   //
   function setSeed(value) {
      seed = "";
      value = value.toUpperCase();
      for (var i = 0; i < value.length; i++) {
         if (("9ABCDEFGHIJKLMNOPQRSTUVWXYZ").indexOf(value.charAt(i)) < 0) {
            seed += "9";
         } else {
            seed += value.charAt(i);
         }
      }
   }
   //
   //  Gets the addresses and transactions of an account
   //  As well as the current balance
   //  Automatically updates the HTML on the site
   //
   function getAccountInfo() {
      // Command to be sent to the IOTA Node
      // Gets the latest transfers for the specified seed
      console.log("in getAccountInfo() for seed "+seed);
      iota.api.getAccountData(seed, function(e, accountData) {
         console.log("Account data", accountData);
         // Update address in case it's not defined yet
         if (!address && accountData.addresses[0]) {
            address = iota.utils.addChecksum(accountData.addresses[accountData.addresses.length - 1]);
            updateAddressHTML(address);
         }
         var transferList = [];
         //  Go through all transfers to determine if the tx contains a message
         //  Only valid JSON data is accepted
         if (accountData.transfers.length > checkedTxs) {
            console.log("RECEIVED NEW TXS");
            accountData.transfers.forEach(function(transfer) {
               var message = iota.utils.extractJson(transfer);
               if( message){
                  console.log("Extracted msg from Transaction: ", message);
                  //var jsonMessage = JSON.parse(message);
                  console.log("JSON: ", message);
                  var newTx = {
                     'name': 'none',
                     'message': message,
                     'value': transfer[0].value,
                     'persistence': transfer[0].persistence,
                     'hash': transfer[0].hash,
                     'tstamp': transfer[0].attachmentTimestamp
                  }
               } else {
                  console.log("Transaction did not contain message");
                  var newTx = {
                     'name': 'none',
                     'message': 'none',
                     'value': 'none',
                     'persistence': transfer[0].persistence,
                     'hash': transfer[0].hash,
                     'tstamp': transfer[0].attachmentTimestamp
                  }
               }
               transferList.push(newTx);
            })
            // Increase the counter of checkedTxs
            checkedTxs = accountData.transfers.length;
         }
         // If we received messages, update the leaderboard
         if (transferList.length > 0) {
            updateLeaderboardHTML(transferList);
         }
      })
   }
   //
   //  Updates the leaderboard list HTML
   //
   function updateLeaderboardHTML(rankedList) {

       // Now we actually sort the rankedList
       rankedList.sort(function (a, b) {
           if (a.value > b.value) {
               return -1;
           }
           if (a.value < b.value) {
               return 1;
           }
           // a must be equal to b
           return 0;
       });

       var html = '';
       var htmlConfirms = '';
       /*
       var hashArr = [ rankedList[0].hash];
       // 
       iota.api.getLatestInclusion( hashArr, (statesArr)=> {
         alert("hashArr:"+JSON.stringify(hashArr)+";inclusionStateArr:"+JSON.stringify(statesArr));    
       });
*/
       for (var i = 0; i < rankedList.length; i++) {

           var message = JSON.stringify(rankedList[i].message);
           var name = rankedList[i].name;
           var value = rankedList[i].value
           var rank = i + 1;

           var listElement = '<tr><td class="iota__rank">' + rank + '<br/>'+formattedNow( rankedList[i].tstamp)+'</td><td class="iota__name">' + name + '</td><td class="iota__message">' + message + '</td><td class="iota__value">' + value + '</td></tr>'
           html += listElement;
           htmlConfirms += '<tr><td>'+ rank +'</td>';
           htmlConfirms += '<td>'+ rankedList[i].hash +'</td>';
           htmlConfirms += '<td>'+ rankedList[i].persistence +'</td></tr>';
       }

       $("#leaderboard").html(html);
       $("#confirms").html(htmlConfirms);
   }
   //
   // Menu Open/Close
   //
   $(".button").on("click tap", function() {
      toggleSidebar();
   });
   //
   // Set seed
   //
   $("#seedSubmit").on("click", function() {
      // We modify the entered seed to fit the criteria of 81 chars, all uppercase and only latin letters
      setSeed($("#userSeed").val());     
      iota = new IOTA({
         'host': 'http://'+$("#walletSrvHost").val(),
         'port': $("#walletSrvPort").val()
      });
      // Then we remove the input
      //$("#enterSeed").html('<div class="alert alert-success" role="alert">Tks for your connection params. You can generate an address now.</div>');
      $(this).hide();
      // We fetch the latest transactions now & every 90 seconds
      getAccountInfo(); 
      setInterval(getAccountInfo, 90000);
      alert("Tks for your connection params. You can generate an address now.");
   });
   //
   // Generate a new address
   //
   $("#genAddress").on("click", function() {
      if (!seed) {
         alert("seed missing, you need to enter one!");
         return;
      }
      // Deterministically generates a new address for the specified seed with a checksum
      iota.api.getNewAddress(seed, {
         'checksum': true
      }, function(e, address) {
         if (!e) {
            address = address;
            updateAddressHTML(address);
         } else {
            console.log(e);
         }
      })
   })
});

