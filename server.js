// const express = require('express');
const express = require('express');
const fileUpload = require('express-fileupload');
const { spawn } = require('child_process');
const path = require('path');
const bodyParser = require('body-parser');
// const { PythonShell } = require('python-shell');
const { PythonShell } = require('python-shell');
// const { PythonShell } = require('python-shell');
const app = express();
const session = require('express-session');
// const app = express();
const os = require('os');
const fs = require('fs');
const multer = require('multer');
// app.use(express.static('public'));
app.use(fileUpload());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); // Middleware to parse JSON bodies
app.use('/output', express.static(path.join(__dirname, 'output')));

// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const { spawn } = require('child_process');
const WebSocket = require('ws');



const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// app.listen(3000, () => {
//     console.log('Server is running on port 3000');
// });

// app.post('/generate-image', (req, res) => {
//     const { mermaid } = req.body;  // Get the mermaid data from the request body
    
//     if (!mermaid) {
//         return res.status(400).json({ error: 'Mermaid content is required' });
//     }

//     const filePath = path.join(__dirname, 'mermaidCode.txt');
    
//     fs.writeFile(filePath, mermaid, (err) => {
//         if (err) {
//             console.error('Error writing mermaid code to file:', err);
//         } else {
//             console.log('Mermaid code successfully saved to mermaidCode.txt');
//         }
//     });

//     // Define the path for saving the image
//     const outputDir = path.join(__dirname, 'output');
    
//     // Create the output directory if it doesn't exist
//     if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir);
//     }

//     // Define the output image path
//     const outputImagePath = path.join(outputDir, 'aaa.png');
//     const process = spawn('python', [path.join(__dirname, 'mermaid.py'), "D:\\Buddy-AI-Complete\\mermaidCode.txt", outputImagePath]);



//     // Capture stdout and stderr from the Python process
//     process.stdout.on('data', (data) => {
//         console.log(`stdout: ${data}`);
//     });

//     process.stderr.on('data', (data) => {
//         console.error(`stderr: ${data}`);
//     });

//     // Handle the process completion
//     process.on('close', (code) => {
//         if (code === 0) {
//             // Return the file path of the generated image
//             res.json({ imagePath: `/output/mermaid_output.png` });
//             console.log(`Image generated and saved at: ${outputImagePath}`);
//         } else {
//             res.status(500).json({ error: 'Failed to generate image' });
//             console.error(`mermaid.py process failed with code ${code}`);
//         }
//     });
// });


app.post('/generate-image', (req, res) => {
    const { mermaid } = req.body;  // Get the mermaid data from the request body
    
    if (!mermaid) {
        return res.status(400).json({ error: 'Mermaid content is required' });
    }

    const filePath = path.join(__dirname, 'mermaidCode.txt');
    
    fs.writeFile(filePath, mermaid, (err) => {
        if (err) {
            console.error('Error writing mermaid code to file:', err);
        } else {
            console.log('Mermaid code successfully saved to mermaidCode.txt');
        }
    });

    // Define the path for saving the image
    const outputDir = path.join(__dirname, 'output');
    
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Define the output image path
    const outputImagePath = path.join(outputDir, 'mermaid_output.png');
    const process = spawn('python', [path.join(__dirname, 'mermaid.py'), "mermaidCode.txt", outputImagePath]);

    // Capture stdout and stderr from the Python process
    process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    // Handle the process completion
    process.on('close', (code) => {
        if (code === 0) {
            // Return the file path of the generated image
            res.json({ imagePath: `/output/mermaid_output.png` });
            console.log(`Image generated and saved at: ${outputImagePath}`);
        } else {
            res.status(500).json({ error: 'Failed to generate image' });
            console.error(`mermaid.py process failed with code ${code}`);
        }
    });
});


app.post('/upload', (req, res) => {
    if (!req.files || !req.files.pdfFile) {
        return res.status(400).send('No file uploaded.');

    }
    const pdfFile = req.files.pdfFile;
    const uploadPath = path.join(__dirname, 'backend', pdfFile.name);

    pdfFile.mv(uploadPath, (err) => {
        if (err) return res.status(500).send(err);

        const process = spawn('python', ['backend/imp_concepts.py', uploadPath]);
        let output = '';

        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.on('close', (code) => {
            try {
                const result = JSON.parse(output);
                res.json(result);
            } catch (error) {
                res.status(500).send('Error processing the PDF.');
            }
        });
    });
});



// Endpoint to get the explanation of a concept
// const { spawn } = require('child_process');
// const path = require('path');
// const os = require('os');

// app.post('/explain', async (req, res) => {
//     const { concept, concatenated_text, timeSpent } = req.body;
//     console.log('Received concept:', concept);
//     console.log('Received concatenated_text length:', concatenated_text.length);
  
//     if (timeSpent !== undefined) {
//       console.log('Time spent on page:', timeSpent, 'seconds');
//       timeSpentData[concept] = timeSpent; // Store in global variable
//     }
  
//     // Create a temporary file for the concatenated text asynchronously
//     const tempFilePath = path.join(os.tmpdir(), `concatenated_text_${Date.now()}.txt`);
//     await fs.promises.writeFile(tempFilePath, concatenated_text);
  
//     // Spawn the Python script for topic explanation and emotion detection
//     const process = spawn('python', ['backend/topicexplain.py', concept, tempFilePath]);
//     const emotionDetectionProcess = spawn('python', ['backend/emotion_detection.py']);
  
//     let explanationOutput = '';
//     let errorOutput = '';
//     let emotionData = '';
  
//     // Capture output and error for the explanation process
//     process.stdout.on('data', (data) => {
//       explanationOutput += data.toString();
//     });
  
//     process.stderr.on('data', (data) => {
//       errorOutput += data.toString();
//     });
  
//     // Capture emotion data
//     emotionDetectionProcess.stdout.on('data', (data) => {
//       emotionData += data.toString();
//     });
  
//     emotionDetectionProcess.stderr.on('data', (data) => {
//       console.error('Emotion detection error:', data.toString());
//     });
  
//     // Wait for both processes to complete
//     try {
//       await Promise.all([
//         new Promise((resolve, reject) => {
//           process.on('close', (code) => {
//             if (code === 0) {
//               resolve(explanationOutput.replace(/\*\*/g, ''));
//             } else {
//               reject(new Error(`Explanation script exited with code ${code}`));
//             }
//           });
//         }),
//         new Promise((resolve, reject) => {
//           emotionDetectionProcess.on('close', (code) => {
//             if (code === 0) {
//               resolve(JSON.parse(emotionData));
//             } else {
//               reject(new Error(`Emotion detection script exited with code ${code}`));
//             }
//           });
//         })
//       ]);
  
//       // Send response with explanation and emotion data
//       res.json({ explanation: explanationOutput, emotionData: JSON.parse(emotionData) });
//     } catch (error) {
//       res.status(500).json({ error: error.message || 'An error occurred.' });
//     } finally {
//       // Clean up the temporary file
//       try {
//         await fs.promises.unlink(tempFilePath);
//       } catch (err) {
//         console.error('Failed to delete temporary file:', err);
//       }
//     }
//   });



const wss = new WebSocket.Server({ port: 8765 });

let emotionDataClients = []; // Store active WebSocket connections

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  emotionDataClients.push(ws);

  ws.on('close', () => {
    emotionDataClients = emotionDataClients.filter((client) => client !== ws);
  });
});

function broadcastEmotionData(data) {
  const message = JSON.stringify(data);
  emotionDataClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.post('/explain', async (req, res) => {
  const { concept, concatenated_text, timeSpent } = req.body;
  console.log('Received concept:', concept);

  if (timeSpent !== undefined) {
    console.log('Time spent on page:', timeSpent, 'seconds');
    timeSpentData[concept] = timeSpent;
  }

  const tempFilePath = path.join(os.tmpdir(), `concatenated_text_${Date.now()}.txt`);
  await fs.promises.writeFile(tempFilePath, concatenated_text);

  const explanationProcess = spawn('python', ['backend/topicexplain.py', concept, tempFilePath]);
  const emotionDetectionProcess = spawn('python', ['backend/emotion_detection.py']);

  let explanationOutput = '';
  let errorOutput = '';

  explanationProcess.stdout.on('data', (data) => {
    explanationOutput += data.toString();
  });

  explanationProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  emotionDetectionProcess.stdout.on('data', (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      broadcastEmotionData(parsedData);
    } catch (error) {
      console.error('Failed to parse emotion data:', error);
    }
  });

  explanationProcess.on('close', (code) => {
    fs.promises.unlink(tempFilePath).catch((err) => console.error('Failed to delete temporary file:', err));
    if (code === 0) {
      res.json({ explanation: explanationOutput });
    } else {
      res.status(500).json({ error: errorOutput });
    }
  });

  explanationProcess.on('error', (error) => {
    console.error('Explanation process error:', error);
    res.status(500).json({ error: 'Failed to start explanation process.' });
  });

  emotionDetectionProcess.on('error', (error) => {
    console.error('Emotion detection process error:', error);
  });
});




app.post('/chat', (req, res) => {
    const { question, concept, text, explanation, conversationHistory } = req.body;

    // Create a temporary file for the concatenated text
    const tempFilePath = path.join(os.tmpdir(), `concatenated_text_${Date.now()}.txt`);
    fs.writeFileSync(tempFilePath, text);

    const process = spawn('python', ['backend/doubtchat.py', question, concept, tempFilePath, explanation, conversationHistory]);
    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
        output += data.toString();
    });

    process.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    process.on('close', (code) => {
        fs.unlinkSync(tempFilePath); // Clean up the temporary file
        res.json({ answer: output });
    });
});

app.post('/test', (req, res) => {
    const { numQuestions, type, level, concept } = req.body;

    if (!numQuestions || !type || !level || !concept) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate numQuestions as a positive integer
    if (isNaN(numQuestions) || numQuestions <= 0) {
        return res.status(400).json({ error: 'Invalid number of questions' });
    }

    const process = spawn('python', ['backend/qanda.py', numQuestions, type, level, concept]);
    let output = '';

    process.stdout.on('data', (data) => {
        output += data.toString();
    });

    process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ error: 'Python script failed' });
        }

        res.json({ questions: output.split('\n').filter(q => q) });
    });
});

app.post('/evaluate', (req, res) => {
    const { concept, answers } = req.body;

    // Format questions and answers
    const questionText = answers.map(a => a.question).join('\n');
    const answerText = answers.map(a => `${a.question}\n${a.answer}`).join('\n\n');

    const fullPrompt = `Evaluate my answers for the below questions.\n\nQuestions:\n\n${questionText}\n\nAnswers:\n\n${answerText}\n\nEvaluate my answers for the correctness and give the following details in the following format:\n\nNumber of correctly answered questions:\nPercentage: (number of correctly answered questions / total number of questions * 100):\n\n...format the response in the below format:\n\n**\n##\n`;

    const process = spawn('python', ['backend/evaluate.py'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    process.stdin.write(JSON.stringify({ prompt: fullPrompt }));
    process.stdin.end();

    let output = '';

    process.stdout.on('data', (data) => {
        output += data.toString();
    });

    process.on('close', (code) => {
        res.json({ evaluation: output });
    });
});

app.post('/translate', async (req, res) => {
    console.log("POST /translate route accessed");

    const { input_code: inputCode, input_language: inputLanguage, output_language: outputLanguage } = req.body;

    console.log('Received data:', { inputCode, inputLanguage, outputLanguage });

    const scriptPath = "D:\\Code Translator\\translate.py";

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python', // Example path to Python executable, adjust as needed
        args: [inputCode, inputLanguage, outputLanguage]
    };

    console.log("start");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No output received from Python script');
        }
    
        const translatedCode = results.join('\n').trim();
        console.log('Python script output:', translatedCode);
        res.send(translatedCode);
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error during translation');
    }

    console.log("end");
});

app.post('/animal_story', async (req, res) => {
    console.log("POST /animal story route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\animal_tales.py';  // Replace with your actual script path

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["animal tales"]
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No story generated');
        }

        const generatedStory = results.join('\n').trim();
        console.log('Python script output:', generatedStory);

        res.json({ gen_story: generatedStory });
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /story route");
});

app.post('/fairy_story', async (req, res) => {
    console.log("POST /fairy story route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\fairy_tales.py';  // Replace with your actual script path

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["fairy tales"]
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No story generated');
        }

        const generatedStory = results.join('\n').trim();
        console.log('Python script output:', generatedStory);

        res.json({ gen_story: generatedStory });
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /story route");
});

app.post('/fiction', async (req, res) => {
    console.log("POST /fairy story route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\fiction.py';  // Replace with your actual script path

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["science fiction"]
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No story generated');
        }

        const generatedStory = results.join('\n').trim();
        console.log('Python script output:', generatedStory);

        res.json({ gen_story: generatedStory });
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /story route");
});


app.post('/mythology_story', async (req, res) => {
    console.log("POST /fairy story route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\mythology.py';  // Replace with your actual script path

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["hindu mythology"]
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No story generated');
        }

        const generatedStory = results.join('\n').trim();
        console.log('Python script output:', generatedStory);

        res.json({ gen_story: generatedStory });
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /story route");
});


app.post('/humor', async (req, res) => {
    console.log("POST /humor story route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\humor.py';  // Replace with your actual script path

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["humor"]
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No story generated');
        }

        const generatedStory = results.join('\n').trim();
        console.log('Python script output:', generatedStory);

        res.json({ gen_story: generatedStory });
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /story route");
});

app.post('/science', async (req, res) => {
    console.log("POST /science fact route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\science.py';

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["science and technology"] // This is your input argument
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No fact generated');
        }

        const generatedFact = results.join('\n').trim();
        console.log('Python script output:', generatedFact);

        res.json({ gen_story: generatedFact }); // Ensure this matches the JS response handling
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /science route");
});


app.post('/mythology_fact', async (req, res) => {
    console.log("POST /mythology fact route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\mythology_fact.py';

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["mythology"] // This is your input argument
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No fact generated');
        }

        const generatedFact = results.join('\n').trim();
        console.log('Python script output:', generatedFact);

        res.json({ gen_story: generatedFact }); // Ensure this matches the JS response handling
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /mythology route");
});

app.post('/animal_fact', async (req, res) => {
    console.log("POST /animal fact route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\animal.py';

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["animals"] // This is your input argument
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No fact generated');
        }

        const generatedFact = results.join('\n').trim();
        console.log('Python script output:', generatedFact);

        res.json({ gen_story: generatedFact }); // Ensure this matches the JS response handling
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /animal fact route");
});

app.post('/food_fact', async (req, res) => {
    console.log("POST /food fact route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\food.py';

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["food"] // This is your input argument
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No fact generated');
        }

        const generatedFact = results.join('\n').trim();
        console.log('Python script output:', generatedFact);

        res.json({ gen_story: generatedFact }); // Ensure this matches the JS response handling
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /food fact route");
});

app.post('/nature_fact', async (req, res) => {
    console.log("POST /nature fact route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\nature.py';

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["nature"] // This is your input argument
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No fact generated');
        }

        const generatedFact = results.join('\n').trim();
        console.log('Python script output:', generatedFact);

        res.json({ gen_story: generatedFact }); // Ensure this matches the JS response handling
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /nature fact route");
});

app.post('/invention', async (req, res) => {
    console.log("POST /invention fact route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\inventions.py';

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["invention"] // This is your input argument
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No fact generated');
        }

        const generatedFact = results.join('\n').trim();
        console.log('Python script output:', generatedFact);

        res.json({ gen_story: generatedFact }); // Ensure this matches the JS response handling
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /invention fact route");
});

app.post('/space', async (req, res) => {
    console.log("POST /space fact route accessed");

    const scriptPath = 'D:\\concat-prepare\\final-enough - Copy\\Integrated-prepare-Me-Ai - Copy\\space.py';

    const options = {
        mode: 'text',
        pythonOptions: ['-u'], // Disable output buffering
        pythonPath: 'python',  // Adjust the Python path if needed
        args: ["space"] // This is your input argument
    };

    console.log("Starting Python script...");

    try {
        let results = await PythonShell.run(scriptPath, options);

        if (!results || results.length === 0) {
            console.error('No output received from Python script');
            return res.status(500).send('No fact generated');
        }

        const generatedFact = results.join('\n').trim();
        console.log('Python script output:', generatedFact);

        res.json({ gen_story: generatedFact }); // Ensure this matches the JS response handling
    } catch (err) {
        console.error('Error executing Python script:', err);
        res.status(500).send('Error generating story');
    }

    console.log("End of POST /space fact route");
});