var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var app = express();
var result = [];
var urls = [];

function generateURLScrapping(url, limit) {
    for(var i = 1; i<=limit; i++){
        urls.push(url+i);
    }
}

//Main Stories : 17 & URL: https://stories.paypal-corp.com/home/previous/
//Archive Stories: 62 & URL: https://stories.paypal-corp.com/archive/previous/

generateURLScrapping("https://stories.paypal-corp.com/archive/previous/", 62);


app.get('/scrape', function(req, res) {


    async.each(urls, function(mainUrl, mainCB) {
        async.waterfall([
            function(callback) {
                var url = mainUrl,
                    urlArr = [];
                request(url, function(error, response, html) {
                    if (!error) {
                        var $ = cheerio.load(html);
                        $('.blog-post').each(function() {
                            var href = $(this).find(".blog-title a").attr("href");
                            urlArr.push(href);
                        });
                        callback(null, urlArr);
                    }
                });
            },
            function(pageURLs, callback) {
                async.each(pageURLs, function(url, cb) {
                    console.log("now scrapping: " + url);
                    request(url, function(error, response, html) {
                        var json = {};
                        var $ = cheerio.load(html);
                        json.title = $('.blog-title-link').text();
                        json.publishDate = new Date($('.date-text').text().replace(/[\n\t]/ig,'')).toISOString();
                        json.content = $('.blog-content').html();//.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
                        json.author = $('font[size=2]').text();
                        //console.log($('.blog-content .wsite-image').first().find('img').attr("src"));
                        result.push(json);
                        cb();
                    });
                }, function(err){
                    callback();
                });
            }
        ],
        function(err, results){
            mainCB();
        });

    }, function() {
        console.log("Total Number of posts scrapped: " + result.length);
        fs.writeFile('output_archive.json', JSON.stringify(result, null, 4), function(err) {
            console.log('File successfully written! - Check your project directory for the output.json file');
            res.send('Check your console!');
        });

    });

});

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;
