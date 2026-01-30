import { useContext } from "react";
import PropTypes from 'prop-types';
import "./MiniCartDrawer.css";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";

const MiniCartDrawer = ({ open, onClose }) => {
  const { cartItems, food_list, getTotalCartAmount, removeFromCart, url } =
    useContext(StoreContext);
  const navigate = useNavigate();

  const items = Object.keys(cartItems || {})
    .map((id) => {
      const qty = cartItems[id];
      if (!qty || qty <= 0) return null;
      const item = food_list.find((f) => f._id === id || f.food_id == id);
      return { id, qty, item };
    })
    .filter(Boolean);

  return (
    <div className={`mini-drawer ${open ? "open" : ""}`}>
      <div className="mini-drawer-header">
        <h3>Your Cart</h3>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="mini-drawer-body">
        {items.length === 0 ? (
          <p className="empty">Your cart is empty</p>
        ) : (
          items.map(({ id, qty, item }) => (
            <div key={id} className="mini-drawer-row">
              <div className="mini-drawer-thumb">
                <img
                  src={
                    // Prefer a full URL from backend
                    item?.imageUrl ||
                    // Then prefer normalized food_image from StoreContext
                    (item?.food_image
                      ? // If it's already a full URL use it, otherwise prefix with backend URL
                        (item.food_image.startsWith("http") || item.food_image.startsWith("https")
                          ? item.food_image
                          : `${url}/images/${item.food_image}`)
                      : // Finally fallback to legacy image filename
                        (item?.image ? `${url}/images/${item.image}` : "/placeholder.png"))
                  }
                  alt={item?.name}
                />
              </div>
              <div className="mini-drawer-info">
                <div className="name">{item?.name || item?.food_name}</div>
                <div className="qty">Qty: {qty}</div>
              </div>
              <div className="mini-drawer-actions">
                <button onClick={() => removeFromCart(id)}>-</button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mini-drawer-footer">
        <div className="total">Total: LKR {getTotalCartAmount() || 0}</div>
        <div className="footer-actions">
          <button
            onClick={() => {
              navigate("/cart");
              onClose();
            }}
            className="view-btn"
          >
            View Cart
          </button>
          <button
            onClick={() => {
              navigate("/placeorder");
              onClose();
            }}
            className="checkout-btn"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniCartDrawer;

MiniCartDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
