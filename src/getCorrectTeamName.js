// Remap team names from those reported by stats.ncaa.org to those reported by collegefootballdata.com
module.exports = team =>
  ({
    "Army West Point": "Army",
    "Coastal Caro.": "Coastal Carolina",
    FIU: "Florida International",
    "Fla. Atlantic": "Florida Atlantic",
    "Ga. Southern": "Georgia Southern",
    Hawaii: "Hawai'i",
    "La.-Monroe": "Louisiana Monroe",
    Massachusetts: "UMass",
    "Miami (FL)": "Miami",
    "Middle Tenn.": "Middle Tennessee",
    "Northern Ill.": "Northern Illinois",
    "San Jose St.": "San José State",
    "South Fla.": "South Florida",
    "Southern California": "USC",
    "Southern Miss.": "Southern Mississippi",
    UConn: "Connecticut",
    UTSA: "UT San Antonio",
    "Western Ky.": "Western Kentucky"
  }[team] || team.replace("St.", "State").replace("Mich.", "Michigan"));
