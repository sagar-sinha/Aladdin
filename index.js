/**
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 
 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 
 http://aws.amazon.com/apache2.0/
 
 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */





'use strict';
var https = require("https");


exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        
        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        
        //     if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.05aecccb3-1461-48fb-a008-822ddrt6b516") {
        //         context.fail("Invalid Application ID");
        //      }
        
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }
        
        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                     context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                     context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};



/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);
    
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
    
    // Add any cleanup logic here
}

function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
    
    // add any session init logic here
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);
    
    var intent = intentRequest.intent,
    intentName = intentRequest.intent.name;
    
    // dispatch custom intents to handlers here
    if ("StockIntent" === intentName) {
        handleStockRequest(intent, session, callback);
    }
    else if ("TopFundIntent" === intentName) {
        handleFundRequest(intent, session, callback);
    }
    else if ("PortfolioIntent" === intentName) {
        handlePortfolioRequest(intent, session, callback);
    }
    else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    }
    else {
        throw "Invalid intent";
    }
}



var CARD_TITLE = "BlackRock"; // Be sure to change this for your skill.
function handleStockRequest(intent, session, callback) {
    var sessionAttributes = {};
    var company = intent.slots.stock.value;
    var speechOutput = "success" ;
    var url = "https://test3.blackrock.com/tools/hackathon/search-securities"+
    "?filters=assetType%3AStock%2C%20countryCode%3AUS&useCache=true&queryField=description" + "&query=" + company;
    https.get(url, function(res) {
              var body = '';
              
              res.on('data', function (chunk) {
                     body += chunk;
                     });
              
              res.on('end', function () {
                     var data = JSON.parse(body);
                     var stockName = data.resultMap.SEARCH_RESULTS[0].resultList[0].description;
                     var securityId = data.resultMap.SEARCH_RESULTS[0].resultList[0].securityId;
                     var url2 = "https://test3.blackrock.com/tools/hackathon/performance?identifiers="+securityId+"&outputDataExpression=resultMap['RETURNS'][0].latestPerf"+"&useCache=true";
                     https.get(url2, function(res) {
                               var body = '';
                               
                               res.on('data', function (chunk) {
                                      body += chunk;
                                      });
                               
                               res.on('end', function () {
                                      var data = JSON.parse(body);
                                      var performace = (data.oneDay* 100).toFixed(2);
                                      //var performace = (data.resultMap.RETURNS[0].latestPerf.oneDay * 100).toFixed(2);
                                      speechOutput = stockName+"'s stock ";
                                      if (performace < 0) {
                                      speechOutput += "went down by ";
                                      }
                                      else {
                                      speechOutput += "gained by ";
                                      }
                                      speechOutput += Math.abs(performace)+"%";
                                      
                                      callback(sessionAttributes,
                                               buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, true));
                                      //eventCallback(stringResult);
                                      });
                               }).on('error', function (e) {
                                     console.log("Got error: ", e);
                                     });
                     
                     
                     
                     //eventCallback(stringResult);
                     });
              }).on('error', function (e) {
                    console.log("Got error: ", e);
                    });
    
    
    
    
}

function handlePortfolioRequest(intent, session, callback) {
    var sessionAttributes = {};
    var speechOutput = "success" ;
    var yearMonthDay = intent.slots.yearMonthDay.value;
    var url =  "https://test3.blackrock.com/tools/hackathon/portfolio-analysis?calculateExposures=true&calculatePerformance=true&positions=AAPL~50%7CMSFT~50%7C&useCache=true";
    https.get(url, function(res) {
              var body = '';
              
              res.on('data', function (chunk) {
                     body += chunk;
                     });
              
              res.on('end', function () {
                     var data = JSON.parse(body);
                     var performance = 0;
                     if (yearMonthDay === "year") {
                     performance = data.resultMap.PORTFOLIOS[0].portfolios[0].returns.latestPerf.oneYear;
                     }
                     else if (yearMonthDay === "month") {
                     performance = data.resultMap.PORTFOLIOS[0].portfolios[0].returns.latestPerf.oneMonth;
                     }
                     else {
                     performance = data.resultMap.PORTFOLIOS[0].portfolios[0].returns.latestPerf.oneDay;
                     }
                     performance = (performance* 100).toFixed(2);
                     
                     speechOutput = "Your stock ";
                     if (performance < 0) {
                     speechOutput += "went down by ";
                     }
                     else {
                     speechOutput += "gained by ";
                     }
                     speechOutput += Math.abs(performance)+"%";
                     
                     if (yearMonthDay === "year") {
                     speechOutput += " over the year";
                     }
                     else if (yearMonthDay === "month") {
                     speechOutput += " over the month";
                     }
                     else {
                     speechOutput += " over the day";
                     }
                     
                     callback(sessionAttributes,
                              buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, true));
                     //eventCallback(stringResult);
                     });
              }).on('error', function (e) {
                    console.log("Got error: ", e);
                    });
    
    
    
    
}

function handleFundRequest(intent, session, callback) {
    var sessionAttributes = {};
    var speechOutput = "success" ;
    var url = "https://test3.blackrock.com/tools/hackathon/search-securities?filters=assetType%3AFund%2C%20countryCode%3AUS&queryField=description&rows=1&sort=stdPerfOneYearAnnualized%20desc&useCache=true";
    https.get(url, function(res) {
              var body = '';
              
              res.on('data', function (chunk) {
                     body += chunk;
                     });
              
              res.on('end', function () {
                     var data = JSON.parse(body);
                     var fundName = data.resultMap.SEARCH_RESULTS[0].resultList[0].fundFamilyName ;
                     speechOutput = fundName+"'s fund is one of the best funds today.";
                     callback(sessionAttributes,buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, true));
                     //eventCallback(stringResult);
                     });
              }).on('error', function (e) {
                    console.log("Got error: ", e);
                    });
    
    
    
    
}





function handleGetHelpRequest(intent, session, callback) {

    var speechOutput = "You can ask me for stock performances, your portfolio analysis, and for the top fund of the day. "+
                        "Questions can be like, "+
    "ask Aladdin  how did Google perform?" +
    "get me the quote for Google?" +
    "which is the best fund?" +
    "how did my portfolio perform over the year?";
    //"ask Aladdin  how did Google stock perform" +
   // "ask Aladdin  how did Google perform today" +
    /*"ask Aladdin  get me the top fund for today" +
     "ask Aladdin  which is the top fund for today" +
     "ask Aladdin  what is the top fund for today" +
     "ask Aladdin  which is the best fund for today" +*/

    var shouldEndSession = true;
    callback(session.attributes,
             buildSpeechletResponseWithoutCard(speechOutput, speechOutput, shouldEndSession));
}

// ------- Helper functions to build responses -------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
    outputSpeech: {
    type: "PlainText",
    text: output
    },
    card: {
    type: "Simple",
    title: title,
    content: output
    },
    reprompt: {
    outputSpeech: {
    type: "PlainText",
    text: repromptText
    }
    },
    shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
    outputSpeech: {
    type: "PlainText",
    text: output
    },
    reprompt: {
    outputSpeech: {
    type: "PlainText",
    text: repromptText
    }
    },
    shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
    };
}
