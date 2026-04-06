interface MenuItemProps {
    name: string;
}

function MenuItem({ name }: MenuItemProps) {
    return (
        <div className="menu-item">
            { name }
        </div>
    )
}

export default MenuItem;