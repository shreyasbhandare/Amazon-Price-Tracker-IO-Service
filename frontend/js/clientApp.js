const subscribeForm = document.getElementById('subscription-form')
const emailTag = document.getElementById('email');
const productUrlTag = document.getElementById('product-url');
const message = document.getElementById('response-message');

subscribeForm.addEventListener('submit', (e) => {
    message.textContent = ""
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
                message.textContent = data.error
                message.style.color = "red"
            } else {
                message.textContent = data.confirmMessage
                message.style.color = "green"
            }
        })
    })
})