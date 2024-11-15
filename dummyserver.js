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
let timeSpentData = {};
// const { spawn } = require('child_process');
// const path = require('path');
// const os = require('os');

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// app.listen(3000, () => {
//     console.log('Server is running on port 3000');
// });


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





app.post('/explain', (req, res) => {
    const { concept, concatenated_text, timeSpent } = req.body;
    console.log('Received concept:', concept);
    console.log('Received concatenated_text length:', concatenated_text.length);
  
    if (timeSpent !== undefined) {
      console.log('Time spent on page:', timeSpent, 'seconds');
      timeSpentData[concept] = timeSpent; // Store in global variable
    }
  
    // Create a temporary file for the concatenated text
    const tempFilePath = path.join(os.tmpdir(), `concatenated_text_${Date.now()}.txt`);
    fs.writeFileSync(tempFilePath, concatenated_text);
  
    // Spawn the Python script for topic explanation
    const process = spawn('python', ['backend/topicexplain.py', concept, tempFilePath]);
  
    // Detect emotions in parallel
    const emotionDetectionProcess = spawn('python', ['backend/emotion_detection.py']);
  
    let output = '';
    let errorOutput = '';
  
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
  
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
  
    emotionDetectionProcess.stdout.on('data', (data) => {
      console.log('Emotion detection output:', data.toString());
    });
  
    emotionDetectionProcess.stderr.on('data', (data) => {
      console.error('Emotion detection error:', data.toString());
    });
  
    // Wait for both processes to complete
    Promise.all([
      new Promise((resolve, reject) => {
        process.on('close', (code) => {
          fs.unlinkSync(tempFilePath); // Clean up the temporary file
          if (errorOutput) {
            console.error('Python script error:', errorOutput);
            reject(errorOutput);
          } else {
            const cleanedOutput = output.replace(/\*\*/g, '');
            resolve(cleanedOutput);
          }
        });
  
        process.on('error', (err) => {
          console.error('Failed to start subprocess.', err);
          reject('Failed to start subprocess.');
        });
      }),
      new Promise((resolve, reject) => {
        emotionDetectionProcess.on('close', (code) => {
          resolve();
        });
  
        emotionDetectionProcess.on('error', (err) => {
          console.error('Failed to start emotion detection subprocess.', err);
          reject('Failed to start emotion detection subprocess.');
        });
      }),
    ])
    .then((explanationOutput) => {
      res.json({ explanation: explanationOutput, emotionData: emotionData });
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
  });

// app.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });

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