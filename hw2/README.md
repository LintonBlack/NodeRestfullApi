# Homework Assignment #2

homework 2.

## Overview

- Using only Node code without dependencies or npm libraries.

## Testing

### Postman

```
Create users:
Url: localhost:3000/users
Method: POST
Body: 
{
	"firstName" : "[Name: string]",
	"lastName" : "[lastName: string]",
	"phone" : "[Phone_Number: number]",
	"email" : "mail@gmail.com",
	"address" : "[address: string]",
	"password" : "[Password]"
}
```

```
Login users:
Url: localhost:3000/tokens
Method: POST
Body: 
{
	"phone" : "[Phone_Number]",
	"password" : "[Password]"
}
```

```
View Pizza Menu:
Url: localhost:3000/menu?phone=[Phone_Number]
Method: GET
Headers: 
{
	"token" : "access_token"
}
```

```
Order Pizza:
Url: localhost:3000/orders
Method: POST
Headers: 
{
	"token" : "access_token",
  "Content-Type" : "application/json"
}
Body:
{
	"content" : [
		 {
            "pizzaId": "5c03ae4f62169e03b4ce4682",
            "quantity": 3
         }
		]
}
```

```
Pay and close Order Pizza:
Url: localhost:3000/payment
Method: GET
Headers: 
{
	"token" : "access_token",
  "Content-Type" : "application/json"
}
Body:
{
  "orderId": "order_id",
	"creditCard" : "tok_visa"
}
```

## License

MIT