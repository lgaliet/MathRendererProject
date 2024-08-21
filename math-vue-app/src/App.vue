<template>
  <div class="app">
    <div class="header">
      <div>
        <Button label="Getting Started" @click="visible = true" />
      </div>
      <div class="toggle-button">
        <ToggleSwitch v-model="isDarkMode" @change="toggleColorScheme" />
      </div>
    </div>
    <h1>Formula Renderer</h1>
    <Divider />
    <form @submit.prevent="handleSubmit">
      <InputText v-model="userInput" placeholder="Enter your question" class="input-text" />
      <Button label="Submit" @click="handleSubmit" class="submit-button" />
    </form>
    <Dialog :visible="visible" @update:visible="val => visible = val" modal header="Getting Started" :style="{ width: '30rem', fontFamily: 'sans-serif' }">
      <span class="text-surface-500 dark:text-surface-400 block mb-8">Welcome to the Formula Renderer!</span>
      <p class="mb-4">To use this app:</p>
      <ul class="mb-8">
        <li>Enter your input in the text field.</li>
        <li>Click "Submit" to render the mathematical formula produced from your input.</li>
        <li>Toggle the switch to switch between light and dark mode.</li>
      </ul>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Close" severity="secondary" @click="visible = false"></Button>
      </div>
    </Dialog>
    <div ref="formulaContainer" v-html="formattedFormula"></div>
    <div class="button-container">
      <Button label="Delete Chat History" @click="deleteChatHistory" class="delete-button" />
    </div>
    <div v-if="chatHistory.length" class="chat-history-container">
      <div v-for="(entry, index) in chatHistory" :key="index" class="chat-entry" :ref="`responseContainer-${index}`">
        <div class="question"><strong>Question:</strong> {{ entry.question }}</div>
        <div class="response"><strong>Response:</strong> <span v-html="entry.response"></span></div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import ToggleSwitch from 'primevue/toggleswitch';
import Divider from 'primevue/divider';
import Dialog from 'primevue/dialog';

export default {
  components: {
    Button,
    InputText,
    ToggleSwitch,
    Divider,
    Dialog 
  },
  data() {
    return {
      userInput: '',
      formattedFormula: '',
      isDarkMode: false,
      visible: false,
      chatHistory: [] 
    };
  },
  mounted() {
    this.fetchChatHistory();
  },
  methods: {
    toggleColorScheme() {
      const element = document.querySelector('html');
      element.classList.toggle('my-app-dark', this.isDarkMode);
    },
    handleSubmit() {
      this.fetchFormula("This is a student's question: " + this.userInput + ". If this question is not math related, please print: Your input could not be rendered as an equation. Otherwise, answer it as asked. Do not provide extra information, only give the formulas in LaTeX.");
    },
    fetchFormula(question) {
      axios.post('https://rozl9l3ghl.execute-api.us-east-1.amazonaws.com/proj', {
        text: question
      })
      .then(response => {
        this.formattedFormula = response.data.formula;
        this.updateChatHistory(this.userInput, this.formattedFormula);
        this.$nextTick(() => {
          this.typesetMath();
        });
      })
      .catch(error => {
        console.error('Error fetching formula:', error);
      });
    },
    typesetMath() {
      if (window.MathJax && window.MathJax.Hub) {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, this.$refs.formulaContainer]);

        this.$nextTick(() => {
          for (let i = 0; i < this.chatHistory.length; i++) {
            const responseContainer = this.$refs[`responseContainer-${i}`];
            if (responseContainer && window.MathJax && window.MathJax.Hub) {
              window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, responseContainer]);
            }
          }
        });
      } else {
        console.error("MathJax is not available.");
      }
    },
    fetchChatHistory() {
      axios.get('https://rozl9l3ghl.execute-api.us-east-1.amazonaws.com/chat-history')
        .then(response => {
          this.chatHistory = response.data.history.map(entry => ({
            question: entry.question.split("This is a student's question: ")[1].split(". If this question is not math related,")[0],
            response: entry.geminiResponse
          }));
          this.$nextTick(() => {
            this.typesetMath();
          });
        })
        .catch(error => {
          console.error('Error fetching chat history:', error);
        });
    },
    updateChatHistory(question, response) {
      this.chatHistory.push({question, response});
    },
    deleteChatHistory() {
      axios.delete('https://rozl9l3ghl.execute-api.us-east-1.amazonaws.com/delete-chat-history')
        .then(() => {
          this.chatHistory = [];
          alert('Chat history deleted successfully!');
        })
        .catch(error => {
          console.error('Error deleting chat history:', error);
        });
    }
  }
};
</script>
<style scoped>
.app {
  font-family: sans-serif;
  text-align: center;
  margin-top: 40px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-text {
  margin-bottom: 10px;
}

.submit-button {
  margin-left: 10px;
}

.toggle-button {
  display: flex;
  align-items: center;
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 10px;
}


.delete-button {
  margin-top: 20px;
}

.chat-history-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chat-entry {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px 0;
  border-radius: 5px;
  text-align: left;
  width: 80%;
  max-width: 600px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.question, .response {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 3px;
  border: 1px solid #06b6d4;
}

.question {
  font-weight: bold;
  background-color: rgba(6, 182, 212, 0.2);
}

.response {
  background-color: rgba(6, 182, 212, 0.1);
  white-space: pre-wrap;
}

.my-app-dark .question {
  background-color: rgba(6, 182, 212, 0.4);
  border-color: #0284c7;
}

.my-app-dark .response {
  background-color: rgba(6, 182, 212, 0.3);
  border-color: #0284c7;
}
</style>
