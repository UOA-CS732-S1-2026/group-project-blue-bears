interface MenuItemProps {
    name: string;
}

function MenuItem({ name }: MenuItemProps) {
    return (
        <div className="menu-item">
            <span className="menu-text">{ name }</span>
        </div>
    )
}

export default MenuItem;