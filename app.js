const fs = require('fs');
const scrapeIt = require('scrape-it');
const json2csv = require('json2csv');
const fields = ['Title', 'Price', 'ImageUrl', 'Url', 'Time'];
const date = JSON.stringify(new Date()).slice(1,11);
let urlObject = [];
const tshirtArray = [];
let count = 0;

// Create a folder called data if it doesn't already exist
fs.access('./data/', fs.constants.F_OK, () => {
  fs.mkdir('./data/', () => {});
});

// Scrapes the URLs for the detail page of each tshirt
const scrapeUrls =
  scrapeIt('http://shirts4mike.com/shirts.php', {
    shirts: {
			listItem: '.products li',
			data: {
				url: {
					selector: 'a',
					attr: 'href'
				}
			}
    }
  });


// Scrapes info from each T-shirt page
const scrapeInfo = urlData => {
  // Assign data to a global variable
  urlObject = urlData;
	// For each url from the first scrape, scrape the title, price, and image URL
	for(let i = 0; i < urlObject.data.shirts.length; i++) {
		scrapeIt(`http://shirts4mike.com/${urlObject.data.shirts[i].url}`, {
      Title: 'title',
			Price: '.price',
			ImageUrl: {
				selector: 'img',
				attr: 'src'
			}
    // then push the scraped object to a global array
  }).then( results => {
        tshirtArray.push(results.data);
        // then assign the corresponding url and time of scrape
        assignUrlAndTime();
        // then add 1 to the counter
        count++
        // If it's the last loop then execute the csv function
        if(count === urlObject.data.shirts.length) {
          csv();
        }
    })
  }
};

// Assigns the corresponding url and the current time to the object
const assignUrlAndTime = () => {
  tshirtArray[count].Url= urlObject.data.shirts[count].url;
  tshirtArray[count].Time = JSON.stringify(new Date()).slice(12,20);
};

// Converts scrape results to csv format
const csv = () => {
  const result = json2csv({ data: tshirtArray, fields: fields });
  fs.writeFile(`data/${date}.csv`, result, errorHandler);
};


// Handles errors if they exist
const errorHandler = error => {
	if(error) {
    // Connection error
    if(error.code == 'ENOENT') {
      console.error(`404 error: Cannot connect to ${error.hostname}`);
    // File busy error
    } else if(error.code == 'EBUSY') {
      console.error("Resource is busy. Please close spreadsheet and run again to update today's scrape.");
    // Otherwise log the error message to the console
    } else {
  		console.error('There was an error: ', error);
    }
  } else {
    console.log("CSV created or updated");
  }
};

// Execute app
scrapeUrls.then(scrapeInfo)
          .catch(errorHandler);
