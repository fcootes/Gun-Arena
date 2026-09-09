const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

let regex = /function makeBot\(assignedTeam: string \| null = null, zombieTypeOverride: 'walker' \| 'runner' \| 'tank' \| null = null\): Bot \{/;
code = code.replace(regex, "function makeBot(assignedTeam: string | null = null, zombieTypeOverride: 'walker' | 'runner' | 'tank' | null = null, isVIP = false): Bot {");

regex = /let team = assignedTeam;\s+if \(isZombie\) team = 'zombie';/;
code = code.replace(regex, "let team = assignedTeam;\n      if (isVIP) team = 'blue';\n      else if (isZombie) team = 'zombie';");

regex = /let weaponTypeIndex = 0;\s+if \(roll < 0\.22\) weaponTypeIndex = 0;/;
code = code.replace(regex, "let weaponTypeIndex = 0;\n      if (isVIP) weaponTypeIndex = 3;\n      else if (roll < 0.22) weaponTypeIndex = 0;");

regex = /let isMarine = false;\s+if \(isZombie\) \{/;
code = code.replace(regex, "let isMarine = false;\n      if (isVIP) {\n        vestColor = 0x0099ff; helmetColor = 0x00bfff; shirtColor = 0x0055aa; pantsColor = 0x003366; skinColor = 0xd2a482;\n      } else if (isZombie) {");

regex = /    return \{\n      id: botId,\n      team,\n      isZombie,\n      zType,/;
code = code.replace(regex, "    return {\n      id: botId,\n      team,\n      isZombie,\n      zType,\n      isVIP,");

fs.writeFileSync('src/App.tsx', code);
console.log('patched makeBot');
