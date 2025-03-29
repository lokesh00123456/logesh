import datetime
import uuid
import json
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional
import os

@dataclass
class MenuItem:
    id: str
    name: str
    description: str
    price: float
    category: str
    availability: bool = True

@dataclass
class OrderItem:
    menu_item: MenuItem
    quantity: int
    special_instructions: str = ""
    
    @property
    def subtotal(self) -> float:
        return self.menu_item.price * self.quantity

@dataclass
class Order:
    id: str
    table_number: int
    server_name: str
    items: List[OrderItem] = field(default_factory=list)
    status: str = "pending"  # pending, preparing, ready, delivered, paid
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    
    @property
    def total(self) -> float:
        return sum(item.subtotal for item in self.items)
    
    def add_item(self, menu_item: MenuItem, quantity: int, special_instructions: str = "") -> None:
        order_item = OrderItem(menu_item=menu_item, quantity=quantity, special_instructions=special_instructions)
        self.items.append(order_item)
        self.updated_at = datetime.datetime.now().isoformat()
    
    def update_status(self, new_status: str) -> None:
        self.status = new_status
        self.updated_at = datetime.datetime.now().isoformat()

class RestaurantOrderSystem:
    def __init__(self, restaurant_name: str):
        self.restaurant_name = restaurant_name
        self.menu_items: Dict[str, MenuItem] = {}
        self.active_orders: Dict[str, Order] = {}
        self.completed_orders: Dict[str, Order] = {}
        self.daily_revenue: float = 0.0
        self.data_file = f"{restaurant_name.lower().replace(' ', '_')}_data.json"
        
        # Load data if exists
        self.load_data()
    
    def add_menu_item(self, name: str, description: str, price: float, category: str) -> MenuItem:
        item_id = str(uuid.uuid4())
        menu_item = MenuItem(id=item_id, name=name, description=description, price=price, category=category)
        self.menu_items[item_id] = menu_item
        self.save_data()
        return menu_item
    
    def update_menu_item(self, item_id: str, **kwargs) -> Optional[MenuItem]:
        if item_id not in self.menu_items:
            return None
        
        menu_item = self.menu_items[item_id]
        for key, value in kwargs.items():
            if hasattr(menu_item, key):
                setattr(menu_item, key, value)
        
        self.save_data()
        return menu_item
    
    def get_menu_by_category(self) -> Dict[str, List[MenuItem]]:
        menu_by_category = {}
        for item in self.menu_items.values():
            if item.availability:
                if item.category not in menu_by_category:
                    menu_by_category[item.category] = []
                menu_by_category[item.category].append(item)
        return menu_by_category
    
    def create_order(self, table_number: int, server_name: str) -> Order:
        order_id = str(uuid.uuid4())
        new_order = Order(id=order_id, table_number=table_number, server_name=server_name)
        self.active_orders[order_id] = new_order
        self.save_data()
        return new_order
    
    def add_item_to_order(self, order_id: str, menu_item_id: str, quantity: int, special_instructions: str = "") -> bool:
        if order_id not in self.active_orders or menu_item_id not in self.menu_items:
            return False
        
        order = self.active_orders[order_id]
        menu_item = self.menu_items[menu_item_id]
        
        if not menu_item.availability:
            return False
        
        order.add_item(menu_item, quantity, special_instructions)
        self.save_data()
        return True
    
    def update_order_status(self, order_id: str, new_status: str) -> bool:
        if order_id not in self.active_orders:
            return False
        
        order = self.active_orders[order_id]
        order.update_status(new_status)
        
        if new_status == "paid":
            self.daily_revenue += order.total
            self.completed_orders[order_id] = order
            del self.active_orders[order_id]
        
        self.save_data()
        return True
    
    def get_orders_by_status(self, status: str) -> List[Order]:
        return [order for order in self.active_orders.values() if order.status == status]
    
    def get_table_orders(self, table_number: int) -> List[Order]:
        return [order for order in self.active_orders.values() if order.table_number == table_number]
    
    def get_daily_revenue(self) -> float:
        return self.daily_revenue
    
    def save_data(self) -> None:
        """Save system data to a JSON file"""
        data = {
            "restaurant_name": self.restaurant_name,
            "menu_items": {item_id: asdict(item) for item_id, item in self.menu_items.items()},
            "active_orders": {order_id: self._order_to_dict(order) for order_id, order in self.active_orders.items()},
            "completed_orders": {order_id: self._order_to_dict(order) for order_id, order in self.completed_orders.items()},
            "daily_revenue": self.daily_revenue
        }
        
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def load_data(self) -> None:
        """Load system data from a JSON file if it exists"""
        if not os.path.exists(self.data_file):
            return
        
        try:
            with open(self.data_file, 'r') as f:
                data = json.load(f)
            
            self.restaurant_name = data.get("restaurant_name", self.restaurant_name)
            self.daily_revenue = data.get("daily_revenue", 0.0)
            
            # Load menu items
            for item_id, item_data in data.get("menu_items", {}).items():
                self.menu_items[item_id] = MenuItem(**item_data)
            
            # Load active orders
            for order_id, order_data in data.get("active_orders", {}).items():
                self.active_orders[order_id] = self._dict_to_order(order_data)
            
            # Load completed orders
            for order_id, order_data in data.get("completed_orders", {}).items():
                self.completed_orders[order_id] = self._dict_to_order(order_data)
                
        except Exception as e:
            print(f"Error loading data: {e}")
    
    def _order_to_dict(self, order: Order) -> dict:
        """Convert Order object to dictionary for JSON serialization"""
        order_dict = asdict(order)
        # Convert OrderItems which contain MenuItem objects
        order_dict["items"] = [
            {
                "menu_item": asdict(item.menu_item),
                "quantity": item.quantity,
                "special_instructions": item.special_instructions
            }
            for item in order.items
        ]
        return order_dict
    
    def _dict_to_order(self, order_dict: dict) -> Order:
        """Convert dictionary to Order object during data loading"""
        # Extract items to process separately
        items_data = order_dict.pop("items", [])
        
        # Create the order without items first
        order = Order(**order_dict)
        order.items = []
        
        # Process and add each item
        for item_data in items_data:
            menu_item_data = item_data.pop("menu_item")
            menu_item = MenuItem(**menu_item_data)
            order_item = OrderItem(menu_item=menu_item, **item_data)
            order.items.append(order_item)
        
        return order


# Example usage of the system
def main():
    # Initialize the system
    restaurant = RestaurantOrderSystem("Delicious Bites")
    
    # Add some menu items if the menu is empty
    if not restaurant.menu_items:
        print("Adding sample menu items...")
        restaurant.add_menu_item("Margherita Pizza", "Classic tomato and mozzarella pizza", 12.99, "Pizza")
        restaurant.add_menu_item("Pepperoni Pizza", "Pizza with pepperoni and cheese", 14.99, "Pizza")
        restaurant.add_menu_item("Caesar Salad", "Romaine lettuce with Caesar dressing and croutons", 8.99, "Salad")
        restaurant.add_menu_item("Spaghetti Bolognese", "Spaghetti with meat sauce", 15.99, "Pasta")
        restaurant.add_menu_item("Chocolate Cake", "Rich chocolate cake with ganache", 7.99, "Dessert")
        restaurant.add_menu_item("Tiramisu", "Classic Italian coffee-flavored dessert", 8.99, "Dessert")
        restaurant.add_menu_item("Soft Drink", "Various sodas", 2.99, "Beverage")
        restaurant.add_menu_item("Coffee", "Freshly brewed coffee", 3.99, "Beverage")
    
    while True:
        print("\n===== Delicious Bites Order Management System =====")
        print("1. View Menu")
        print("2. Create New Order")
        print("3. View Active Orders")
        print("4. Update Order Status")
        print("5. Add Item to Order")
        print("6. View Daily Revenue")
        print("7. Exit")
        
        choice = input("\nEnter your choice (1-7): ")
        
        if choice == "1":
            print("\n===== MENU =====")
            menu_by_category = restaurant.get_menu_by_category()
            for category, items in menu_by_category.items():
                print(f"\n--- {category} ---")
                for item in items:
                    print(f"{item.id}: {item.name} - ${item.price:.2f}")
                    print(f"   {item.description}")
        
        elif choice == "2":
            try:
                table_number = int(input("Enter table number: "))
                server_name = input("Enter server name: ")
                order = restaurant.create_order(table_number, server_name)
                print(f"Order created successfully! Order ID: {order.id}")
            except ValueError:
                print("Invalid input. Please enter a valid table number.")
        
        elif choice == "3":
            print("\n===== ACTIVE ORDERS =====")
            if not restaurant.active_orders:
                print("No active orders.")
            else:
                for order_id, order in restaurant.active_orders.items():
                    print(f"\nOrder ID: {order_id}")
                    print(f"Table: {order.table_number} | Server: {order.server_name}")
                    print(f"Status: {order.status} | Created: {order.created_at}")
                    print("Items:")
                    for item in order.items:
                        print(f"  - {item.quantity}x {item.menu_item.name} (${item.menu_item.price:.2f} each)")
                        if item.special_instructions:
                            print(f"    Special instructions: {item.special_instructions}")
                    print(f"Total: ${order.total:.2f}")
        
        elif choice == "4":
            order_id = input("Enter Order ID: ")
            print("Available statuses: pending, preparing, ready, delivered, paid")
            new_status = input("Enter new status: ")
            if restaurant.update_order_status(order_id, new_status):
                print(f"Order status updated to {new_status}")
            else:
                print("Order not found or invalid status.")
        
        elif choice == "5":
            order_id = input("Enter Order ID: ")
            if order_id not in restaurant.active_orders:
                print("Order not found.")
                continue
                
            # Show menu for convenience
            print("\n===== MENU =====")
            menu_by_category = restaurant.get_menu_by_category()
            for category, items in menu_by_category.items():
                print(f"\n--- {category} ---")
                for item in items:
                    print(f"{item.id}: {item.name} - ${item.price:.2f}")
            
            menu_item_id = input("\nEnter Menu Item ID: ")
            if menu_item_id not in restaurant.menu_items:
                print("Menu item not found.")
                continue
                
            try:
                quantity = int(input("Enter quantity: "))
                if quantity <= 0:
                    print("Quantity must be positive.")
                    continue
            except ValueError:
                print("Invalid quantity.")
                continue
                
            special_instructions = input("Special instructions (optional): ")
            
            if restaurant.add_item_to_order(order_id, menu_item_id, quantity, special_instructions):
                print("Item added to order successfully!")
            else:
                print("Failed to add item to order.")
        
        elif choice == "6":
            print(f"\nDaily Revenue: ${restaurant.get_daily_revenue():.2f}")
        
        elif choice == "7":
            print("Thank you for using Delicious Bites Order Management System!")
            break
        
        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()