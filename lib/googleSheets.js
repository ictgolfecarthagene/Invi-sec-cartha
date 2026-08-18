import Papa from 'papaparse';

export async function getMembersList() {
  // Your published CSV link
  const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_rfHUP8qVHpAAA_5fsOikvZUOXyYIyQrksh9mnzd2xjYkU949qmq4q7EhVDmA1A8S0QQsL7c3Zxaw/pub?gid=629488919&single=true&output=csv";
  
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      complete: (results) => {
        // results.data is an array of arrays (rows and columns)
        // Skip the first 2 lines using .slice(2)
        const members = results.data.slice(2).map(row => {
          return row[1]?.trim(); // Index 1 is Column B
        }).filter(name => name); // Remove any empty rows
        
        resolve(members);
      }
    });
  });
}