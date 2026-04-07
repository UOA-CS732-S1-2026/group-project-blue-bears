interface MenuItemProps {
    name: string;
    onClick?: () => void;
}

function MenuItem({ name, onClick }: MenuItemProps) {
    return (
        <button className="menu-item" onClick={onClick}>
            <span className="menu-text">{ name }</span>
        </button>
    )
}

export default MenuItem;