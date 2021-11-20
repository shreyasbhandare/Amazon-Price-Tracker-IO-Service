const subscribeForm = document.querySelector('form')
const emailTag = document.getElementById('email');
const productUrlTag = document.getElementById('product-url');
const messageOne = document.getElementById('message-one');

subscribeForm.addEventListener('submit', (e) => {
    messageOne.textContent = ""
    e.preventDefault()

    var payload = {
        email: emailTag.value,
        productUrl: productUrlTag.value
    };
      
    fetch('/subscribe', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then((response) => {
        response.json().then((data) => {
            if(data.error) {
                messageOne.textContent = data.error
            } else {
                messageOne.textContent = data.confirmMessage
            }
        })
    })
})