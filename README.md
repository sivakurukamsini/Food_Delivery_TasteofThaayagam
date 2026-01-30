Food Delivery Admin Dashboard

A modern and responsive admin dashboard for managing food delivery operations.

 Tech Stack
- React
- Vite
- JavaScript (ES6+)
- CSS3
- Axios (for API calls)
- React Router
- React Toastify (notifications)
- Internationalization (i18n)

 Features
- Responsive Admin UI
- Add/Edit/Delete food items
- Manage food categories
- View and manage orders
- User management
- Reservation management
- Supplier management
- Dashboard analytics
- Fast loading with Vite
- Modern and intuitive design
- Multi-language support (i18n)
- Real-time notifications

 Project Structure

admin/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Navbar/
│   │   └── Sidebar/
│   ├── pages/            # Admin pages
│   │   ├── Add/          # Add new items
│   │   ├── Dashboard/    # Dashboard overview
│   │   ├── List/         # View all items
│   │   ├── Orders/       # Order management
│   │   ├── Reservation/  # Reservation management
│   │   ├── Supplier/     # Supplier management
│   │   ├── User/         # User management
│   │   ├── Settings/     # Admin settings
│   │   └── MyAccount/    # Account settings
│   ├── i18n/             # Internationalization
│   ├── services/         # API services
│   │   ├── api.js        # API configurations
│   │   ├── csv.js        # CSV export functionality
│   │   └── pdf.js        # PDF export functionality
│   ├── assets/           # Images and static files
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static public files
├── package.json
├── vite.config.js
└── README.md


 Installation & Setup

 Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Running backend server

 Installation Steps
bash
cd admin
npm install
npm run dev


The admin dashboard will be available at `http://localhost:5174`

 Environment Setup

Make sure your backend is running and configured properly. The admin dashboard communicates with the backend API for all operations.

 Admin Functionalities

 Dashboard
- View overall statistics
- Monitor recent orders
- Track system performance

 Food Management
- Add new food items with images
- Edit existing items
- Delete items
- Organize by categories
- CSV/PDF export functionality

 Order Management
- View all orders
- Update order status
- Track order details
- Customer information

 Reservation Management
- View table reservations
- Manage booking status
- Update reservation details

 User Management
- View all users
- Add new users
- Manage user roles
- Edit user information

 Supplier Management
- Manage suppliers
- Track supplier details
- Update supplier information

 Settings
- Configure admin preferences
- Manage system settings

 Authentication

Admin users must login with valid credentials. The authentication is handled through the backend API with JWT tokens.

 Purpose

This project was built to practice frontend development and showcase administrative dashboard skills for managing food delivery operations.

 Contributing

Feel free to fork and contribute to this project!

 License

This project is open source and available under the MIT License.

 Author

Kamsini Sivakuru

 Contact

GitHub: https://github.com/sivakurukamsini/Food_Delivery_TasteofThaayagam



