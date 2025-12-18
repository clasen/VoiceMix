import { VoiceMix } from "../index.js";
import dotenv from "dotenv";
import fs from 'fs';

dotenv.config();

// Read and parse the lines.json file
const script = JSON.parse(fs.readFileSync('./lines.json', 'utf8'));
const voiceMix = new VoiceMix()//.useResemble().lang('en-US');

// Process each line in the script
// for (const entry of script) {

//     voiceMix
//         .prompt(entry.prompt || 'Friendly and conversational tone')
//         // .voice('ba875a0a') // Peter v2
//         .voice('EbhcCfMvNsbvjN6OhjpJ')
//         .say(entry.english)
//         .save();
// }

// const voiceMix = new VoiceMix();


// voiceMix.voice("dBRpMbVO8Bjs9wBZC6cb")
// voiceMix.say(`As soon as someone picked up, he said: "Dad, it's me, listen carefully. I'm at DAF2... with Liev Thibot."`);
// voiceMix.save();

// let line = `As soon as someone picked up, he said: "Dad, it's me, listen carefully. I'm at DAF2... with Liev Thibot."`;

// // line = `Pero recuerdo la sensación. Fue como si alguien hubiera sacado todo el aire de la habitación.`;

// const voiceMix = new VoiceMix();
// voiceMix.useResemble()
//     .prompt('clears his throat before starting')
//     // .voice('0a73c559')
//     // .lang('es-us')
//     // .voice('f23e8ffe')
//     // .voice('fcf8490c')
//     .voice('ba875a0a') // Peter v2
//     .say(line)
//     .save();

// Example using Cartesia
// Note: Replace with your actual Cartesia voice ID from your account
// voiceMix.useCartesia()
//     .voice('6ccbfb76-1fc6-48f7-b71d-91ac6298247b') // Cartesia voice ID from your account
//     .say('<emotion value="happy" />Hmm… okay, let me think… yeah, this is actually kind of fun. [laughter] Let\'s dive in.')
//     .save();

// Example using ElevenLabs v3 model
// v3 is the latest and most advanced model from ElevenLabs
voiceMix
    .v3() // Use the ElevenLabs v3 model
    .voice('dxvGlXoa4TLMyfYR6uC9') // ElevenLabs voice ID
    .say('[sorprendida] gracias! [risas] dos personas creyeron en mí cuando nadie más lo hizo!')
    .save();