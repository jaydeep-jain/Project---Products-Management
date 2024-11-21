
# Overview-->

This project is a backend system for managing products, users, carts, and orders. Built using Node.js, Express, and MongoDB, it provides a comprehensive API to support an e-commerce application.

## Key Features
The project is divided into four primary features:

1) User Management
2) Product Management
3) Cart Management
4) Order Management

Each feature includes a full CRUD setup, API endpoint creation, testing, deployment, and integration capability with a frontend.

# Technologies Used

Backend: Node.js, Express.js
Database: MongoDB
Storage: AWS S3 for storing images
Authentication: JSON Web Tokens (JWT) for secure authorization

# Project Structure

Each feature is developed as follows:

1) Database Schema: MongoDB schemas and models
2) API Development: RESTful API endpoints
3) Testing: API testing and validation
4) Deployment: Ready for deployment in a production environment


#  Feature I - User Management

1) User Model :

```yaml
{ 
  fname: {string, mandatory},
  lname: {string, mandatory},
  email: {string, mandatory, valid email, unique},
  profileImage: {string, mandatory}, // s3 link
  phone: {string, mandatory, unique, valid Indian mobile number}, 
  password: {string, mandatory, minLen 8, maxLen 15}, // encrypted password
  address: {
    shipping: {
      street: {string, mandatory},
      city: {string, mandatory},
      pincode: {number, mandatory}
    },
    billing: {
      street: {string, mandatory},
      city: {string, mandatory},
      pincode: {number, mandatory}
    }
  },
  createdAt: {timestamp},
  updatedAt: {timestamp}
}
```


# User API Endpoints

1 ) POST /register: Registers a new user. Accepts profile image and user details, saves image to S3, and encrypts password.

2) POST /login: Authenticates user with email and password, returns JWT token.

3) GET /user/
/profile: Retrieves user profile (requires authorization).

4) PUT /user/
/profile: Updates user profile information (requires authorization).


# Feature II - Product Management

2) Product Model

```yaml
{ 
  title: {string, mandatory, unique},
  description: {string, mandatory},
  price: {number, mandatory, valid number/decimal},
  currencyId: {string, mandatory, INR},
  currencyFormat: {string, mandatory, Rupee symbol},
  isFreeShipping: {boolean, default: false},
  productImage: {string, mandatory},  // s3 link
  style: {string},
  availableSizes: {array of string, at least one size, enum["S", "XS","M","X", "L","XXL", "XL"]},
  installments: {number},
  deletedAt: {Date, when the document is deleted}, 
  isDeleted: {boolean, default: false},
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```

# Feature III - Cart Management

3) Cart Model

```yaml
{
  userId: {ObjectId, refs to User, mandatory, unique},
  items: [{
    productId: {ObjectId, refs to Product model, mandatory},
    quantity: {number, mandatory, min 1}
  }],
  totalPrice: {number, mandatory, comment: "Holds total price of all the items in the cart"},
  totalItems: {number, mandatory, comment: "Holds total number of items in the cart"},
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```

# Feature IV - Order Management
4) Order Model

```yaml
{
  userId: {ObjectId, refs to User, mandatory},
  items: [{
    productId: {ObjectId, refs to Product model, mandatory},
    quantity: {number, mandatory, min 1}
  }],
  totalPrice: {number, mandatory, comment: "Holds total price of all the items in the cart"},
  totalItems: {number, mandatory, comment: "Holds total number of items in the cart"},
  totalQuantity: {number, mandatory, comment: "Holds total number of quantity in the cart"},
  cancellable: {boolean, default: true},
  status: {string, default: 'pending', enum[pending, completed, cancled]},
  deletedAt: {Date, when the document is deleted}, 
  isDeleted: {boolean, default: false},
  createdAt: {timestamp},
  updatedAt: {timestamp},
}
```
# Authentication and Authorization -
Implemented secure authentication with JWT. All sensitive endpoints, such as updating or accessing a user’s profile, require token validation and ensure that the user accessing the endpoint is authorized.

