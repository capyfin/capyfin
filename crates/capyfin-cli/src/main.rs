fn main() -> Result<(), Box<dyn std::error::Error>> {
    let output = capyfin_cli::run(capyfin_cli::parse())?;
    println!("{output}");
    Ok(())
}
