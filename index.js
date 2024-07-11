// Wrapping the whole extension in a JS function and calling it immediately 
// (ensures all global variables set in this extension cannot be referenced outside its scope)
(async function(codioIDE, window) {
  
  // Refer to Anthropic's guide on system prompts: https://docs.anthropic.com/claude/docs/system-prompts
  const systemPrompt = `You are a helpful assistant helping students understand programming error messages.
Here are some common programming errors followed by their respective explanations written by a teacher:

<generalized_errors>
<generalized_error id=1>
Error:
cannot find symbol

Explanation:
Variables and methods (sometimes referred to as functions) must be declared before they can be accessed.

For variables this could look like:
dog = "Rover"
print(dog) 

Variables can also hold structures such as:
\`\`\`
String\\[\\] names = {"Annie", "Bianca", " Caroline"};
System.out.println(names\\[1\\]);
\`\`\`

Do you see the declaration? Check your spelling!
The compiler counts different spellings as different variables.

Method calls must match both the method name and the parameters.

If a class is missing, you may be missing an import statement.
</generalized_error>
<generalized_error id=2>
Error:
list index out of range

Explanation:
Arrays start at index 0. That means an array of size 10 (e.g. int[] nums = new int[10];) has indices from 0 to 9.

Out of bound errors are often off-by-one errors. Check that you are not accessing one past the end of the array.

For example, take these two different versions of looping over the array from above:
\`\`\`
for(int i=0; i < nums.length; i++)
{ 
    System.out.println(nums[i]); 
}

for(int i=0; i <= nums.length-1; i++)
{ 
    System.out.println(nums[i]); 
}
\`\`\`

However, if you include the = without the -1 you get an error:
\`\`\`
for(int i=0; i <= nums.length; i++)
{ 
    System.out.println(nums[i]); 
}
\`\`\`
</generalized_error>
<generalized_error id=3>
Error:
Could not find or load main class

Explanation:
The main class is the class which contains the main method. Computers need a main method to know where to start running the code.

For example, in Java the main method is declared as:
\`\`\`
public static void main(String args\[\]) {...}
\`\`\`
</generalized_error>
</generalized_errors>

You will be provided with a programming error message in the <error_message> tag.
First, check if the <error_message> matches any of the <generalized_errors>. If so, output the provided 
corresponding teacher explanation inside the explanation tag in markdown format, without generating a new explanation and without xml tags.

If the error message does not match any of the generalized ones:
- Carefully review the <assignment> and <code>, if provided, to understand the context of the error
- Explain in plain, non-technical language what is causing the error, without suggesting any
potential fixes or solutions
- If relevant, mention any common misconceptions that may be contributing to the student's error
- For relatively simple errors, keep your explanation brief and to the point
- When referring to code in your explanation, use markdown syntax - wrap inline code with \` and
multiline code with \`\`\`
  `
  
  // register(id: unique button id, name: name of button visible in Coach, function: function to call when button is clicked) 
  codioIDE.coachBot.register("errorAugmentButton", "Explain this error message", onButtonPress)

  async function onButtonPress() {
    // Function that automatically collects all available context 
    // returns the following object: {guidesPage, assignmentData, files, error}
    const context = await codioIDE.coachBot.getContext()
    
    console.log('bot context', context)
    
    const input = await codioIDE.coachBot.input("Please paste the error message you want me to explain!")
    console.log(input)

    const valPrompt = `<Instructions>

Please determine whether the following text appears to be a programming error message or not:

<text>
${input}
</text>

Output your final Yes or No answer in JSON format with the key 'answer'

Focus on looking for key indicators that suggest the text is an error message, such as:

- Words like "error", "exception", "stack trace", "traceback", etc.

- Line numbers, file names, or function/method names

- Language that sounds like it is reporting a problem or issue

- Language that sounds like it is providing feedback

- Technical jargon related to coding/programming

If you don't see clear signs that it is an error message, assume it is not. Only answer "Yes" if you are quite confident it is an error message. 
If it is not a traditional error message, only answer "Yes" if it sounds like it is providing feedback as part of an automated grading system.

</Instructions>"`

    const validation_result = await codioIDE.coachBot.ask({
        systemPrompt: "You are a helpful assistant.",
        userPrompt: valPrompt
    }, {preventMenu: true})

    if (validation_result.result.includes("Yes")) {
        //Define your assistant's userPrompt - this is where you will provide all the context you collected along with the task you want the LLM to generate text for.
        const userPrompt = `Here is the error message:

<error_message>
${input}
</error_message>
 Here is the description of the programming assignment the student is working on:

<assignment>
${context.guidesPage.content}
</assignment>

Here is the student's current code:

<current_code>
${context.files[0]}
</current_code> 

If <assignment> and <current_code> are empty, assume that they're not available. 
With the available context, follow the guidelines and respond with either the teacher written explanation or your own if it doesn't match any <generalized_errors>

If generating your own explanation, make sure it is not longer than 2-3 sentences, and double check that it does not suggest any fixes or solutions. 
The explanation should only describe the cause of the error. Do not tell the student whether or not it matches. Just provide the explanation in either case only.`

        const result = await codioIDE.coachBot.ask({
            systemPrompt: systemPrompt,
            userPrompt: userPrompt
        })
    }
    else {
        codioIDE.coachBot.write("This doesn't look like an error. I'm sorry, I can only help you by explaining programming error messages.")
        codioIDE.coachBot.showMenu()
    }
  }

})(window.codioIDE, window)