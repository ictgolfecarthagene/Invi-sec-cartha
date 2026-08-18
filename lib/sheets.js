import Papa from 'papaparse';

export async function getMembersList() {
  const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_rfHUP8qVHpAAA_5fsOikvZUOXyYIyQrksh9mnzd2xjYkU949qmq4q7EhVDmA1A8S0QQsL7c3Zxaw/pub?gid=629488919&single=true&output=csv";
  
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      complete: (results) => {
        // Skip first 2 lines, get Column B (index 1)
        const members = results.data.slice(2).map(row => row[1]?.trim()).filter(name => name);
        resolve(members);
      }
    });
  });
}