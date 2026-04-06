interface MenuItemProps {
    name: string;
}

function MenuItem({ name }: MenuItemProps) {
    return (
        <button className="menu-item">
            <span className="menu-text">{ name }</span>
        </button>
    )
}

export default MenuItem;